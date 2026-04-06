import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@creo/prisma';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface UserPayload {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        language: dto.language ?? 'en',
      },
    });

    this.logger.log(`User registered: ${user.email}`);

    const tokens = await this.generateTokens({ id: user.id, email: user.email, role: user.role });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log(`User logged in: ${user.email}`);

    const tokens = await this.generateTokens({ id: user.id, email: user.email, role: user.role });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async logout(rawRefreshToken: string) {
    const jti = this.extractJti(rawRefreshToken);
    if (jti) {
      await this.prisma.refreshToken.deleteMany({ where: { token: jti } });
    }
    this.logger.log('User logged out');
  }

  async refreshTokens(rawRefreshToken: string) {
    const decoded = this.decodeRefreshToken(rawRefreshToken);
    if (!decoded) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: decoded.sub, token: decoded.jti },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (decoded.sub) {
        await this.prisma.refreshToken.deleteMany({ where: { userId: decoded.sub } });
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: decoded.sub },
    });

    const tokens = await this.generateTokens({ id: user.id, email: user.email, role: user.role });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  private extractJti(rawToken: string): string | null {
    try {
      const decoded = this.jwt.decode(rawToken) as { jti?: string } | null;
      return decoded?.jti ?? null;
    } catch {
      return null;
    }
  }

  private decodeRefreshToken(rawToken: string): { sub: string; jti: string } | null {
    try {
      const payload = this.jwt.verify(rawToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      }) as { sub?: string; jti?: string };
      if (payload.sub && payload.jti) {
        return { sub: payload.sub, jti: payload.jti };
      }
      return null;
    } catch {
      return null;
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return this.sanitizeUser(user);
  }

  async updateLanguage(userId: string, language: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { language },
    });
    return this.sanitizeUser(user);
  }

  private async generateTokens(payload: UserPayload): Promise<TokenPair> {
    const accessToken = this.jwt.sign(
      { sub: payload.id, email: payload.email, role: payload.role },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );

    const refreshTokenValue = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: payload.id,
        expiresAt,
      },
    });

    const refreshToken = this.jwt.sign(
      { sub: payload.id, email: payload.email, role: payload.role, jti: refreshTokenValue },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: { id: string; email: string; name: string | null; role: string; language: string }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      language: user.language,
    };
  }
}
