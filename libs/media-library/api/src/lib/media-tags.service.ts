import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@creo/prisma';

@Injectable()
export class MediaTagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, name: string) {
    return this.prisma.mediaTag.upsert({
      where: { userId_name: { userId, name } },
      create: { userId, name },
      update: {},
    });
  }

  async list(userId: string) {
    return this.prisma.mediaTag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async delete(userId: string, id: string) {
    const tag = await this.prisma.mediaTag.findFirst({
      where: { id, userId },
    });
    if (!tag) throw new NotFoundException('Tag not found');

    await this.prisma.mediaTag.delete({ where: { id } });
    return { id };
  }
}
