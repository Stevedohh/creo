import type { ProjectTimeline } from '@creo/projects-schema';

export interface Project {
  id: string;
  title: string;
  description: string | null;
  timeline: ProjectTimeline;
  thumbnailKey: string | null;
  status: 'draft' | 'rendering' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: 'draft' | 'rendering' | 'archived';
}
