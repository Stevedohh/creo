import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@creo/prisma';

@Injectable()
export class MediaFoldersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, name: string, parentId?: string) {
    if (parentId) {
      const parent = await this.prisma.mediaFolder.findFirst({
        where: { id: parentId, userId },
      });
      if (!parent) throw new NotFoundException('Parent folder not found');
    }

    return this.prisma.mediaFolder.create({
      data: { userId, name, parentId: parentId ?? null },
    });
  }

  async list(userId: string, parentId?: string) {
    return this.prisma.mediaFolder.findMany({
      where: {
        userId,
        parentId: parentId ?? null,
      },
      orderBy: { name: 'asc' },
    });
  }

  async rename(userId: string, id: string, name: string) {
    const folder = await this.prisma.mediaFolder.findFirst({
      where: { id, userId },
    });
    if (!folder) throw new NotFoundException('Folder not found');

    return this.prisma.mediaFolder.update({
      where: { id },
      data: { name },
    });
  }

  async delete(userId: string, id: string) {
    const folder = await this.prisma.mediaFolder.findFirst({
      where: { id, userId },
    });
    if (!folder) throw new NotFoundException('Folder not found');

    const [childCount, assetCount] = await Promise.all([
      this.prisma.mediaFolder.count({ where: { parentId: id } }),
      this.prisma.mediaAsset.count({ where: { folderId: id } }),
    ]);

    if (childCount > 0 || assetCount > 0) {
      throw new BadRequestException(
        'Cannot delete a non-empty folder. Remove all files and subfolders first.',
      );
    }

    await this.prisma.mediaFolder.delete({ where: { id } });
    return { id };
  }

  async breadcrumbs(userId: string, folderId: string) {
    const path: { id: string; name: string }[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder: { id: string; name: string; parentId: string | null } | null =
        await this.prisma.mediaFolder.findFirst({
          where: { id: currentId, userId },
          select: { id: true, name: true, parentId: true },
        });
      if (!folder) break;
      path.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;
    }

    return path;
  }
}
