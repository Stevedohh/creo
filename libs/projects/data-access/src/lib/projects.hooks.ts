import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProjectTimeline } from '@creo/projects-schema';
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
  updateProjectTimeline,
} from './projects.api';
import type { UpdateProjectRequest } from './projects.types';

const PROJECTS_QUERY_KEY = ['projects'] as const;

export const useProjects = () =>
  useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: getProjects,
  });

export const useProject = (id: string) =>
  useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, id],
    queryFn: () => getProject(id),
    enabled: !!id,
  });

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      updateProject(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...PROJECTS_QUERY_KEY, variables.id],
      });
    },
  });
};

export const useUpdateProjectTimeline = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, timeline }: { id: string; timeline: ProjectTimeline }) =>
      updateProjectTimeline(id, timeline),
    onSuccess: (data) => {
      queryClient.setQueryData([...PROJECTS_QUERY_KEY, data.id], data);
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
};
