import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@creo/prisma';
import { MediaAssetsService } from './media-assets.service';

@Injectable()
export class ProjectAssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaAssets: MediaAssetsService,
  ) {}

  private async findProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async list(userId: string, projectId: string) {
    await this.findProject(userId, projectId);
    const rows = await this.prisma.projectAsset.findMany({
      where: { projectId },
      orderBy: { addedAt: 'desc' },
    });
    const assets = await Promise.all(
      rows.map((row) => this.mediaAssets.findOneWithUrl(userId, row.assetId)),
    );
    return assets;
  }

  async attach(userId: string, projectId: string, assetId: string) {
    await this.findProject(userId, projectId);
    await this.mediaAssets.findOne(userId, assetId);

    await this.prisma.projectAsset.upsert({
      where: { projectId_assetId: { projectId, assetId } },
      create: { projectId, assetId },
      update: {},
    });

    return { projectId, assetId };
  }

  async detach(userId: string, projectId: string, assetId: string) {
    await this.findProject(userId, projectId);

    await this.prisma.projectAsset
      .delete({ where: { projectId_assetId: { projectId, assetId } } })
      .catch(() => undefined);

    return { projectId, assetId };
  }
}
