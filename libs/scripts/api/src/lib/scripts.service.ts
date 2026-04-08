import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@creo/prisma';
import { CreateScriptDto } from './dto/create-script.dto';
import { UpdateScriptDto } from './dto/update-script.dto';

@Injectable()
export class ScriptsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateScriptDto) {
    return this.prisma.script.create({
      data: {
        title: dto.title,
        country: dto.country,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.script.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const script = await this.prisma.script.findFirst({
      where: { id, userId },
    });

    if (!script) {
      throw new NotFoundException('Script not found');
    }

    return script;
  }

  async update(userId: string, id: string, dto: UpdateScriptDto) {
    await this.findOne(userId, id);

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) {
      data.content = dto.content;
      data.wordCount = dto.content.trim().split(/\s+/).filter(Boolean).length;
    }
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.rating !== undefined) data.rating = dto.rating;

    return this.prisma.script.update({
      where: { id },
      data,
    });
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.script.delete({ where: { id } });
    return { id };
  }
}
