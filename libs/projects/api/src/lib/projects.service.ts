import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService } from '@creo/prisma';
import {
  emptyProjectTimeline,
  parseProjectTimeline,
  type ProjectTimeline,
} from '@creo/projects-schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        title: dto.title,
        description: dto.description,
        timeline: emptyProjectTimeline() as unknown as Prisma.InputJsonValue,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(userId: string, id: string, dto: UpdateProjectDto) {
    await this.findOne(userId, id);

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async updateTimeline(userId: string, id: string, timeline: unknown) {
    await this.findOne(userId, id);

    let validated: ProjectTimeline;
    try {
      validated = parseProjectTimeline(timeline);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Invalid timeline payload',
      );
    }

    return this.prisma.project.update({
      where: { id },
      data: { timeline: validated as unknown as Prisma.InputJsonValue },
    });
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.project.delete({ where: { id } });
    return { id };
  }
}
