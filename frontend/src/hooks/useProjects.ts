import apiClient, { handleApiError } from "@/services/apiClient";
import type {
  CreateProjectRequest,
  Project,
  ProjectFilters,
  UpdateProjectRequest,
} from "@/types";
import { useMemo } from "react";
import {
  useOptimisticMutation,
  useOptimisticQuery,
} from "./useOptimisticQuery";

// Projects API functions
const projectsApi = {
  getProjects: async (filters?: ProjectFilters): Promise<Project[]> => {
    const params = new URLSearchParams();
    if (filters?.search) {
      params.append("search", filters.search);
    }

    const response = await apiClient.get<{
      success: boolean;
      projects: Project[];
      total: number;
      page: number;
      limit: number;
    }>(`/projects?${params.toString()}`);
    return response.data.projects;
  },

  getProject: async (projectId: string): Promise<Project> => {
    const response = await apiClient.get<{
      success: boolean;
      project: Project;
    }>(`/projects/${projectId}`);
    return response.data.project;
  },

  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await apiClient.post<{
      success: boolean;
      project: Project;
    }>("/projects", data);
    return response.data.project;
  },

  updateProject: async (
    projectId: string,
    data: UpdateProjectRequest,
  ): Promise<Project> => {
    const response = await apiClient.put<{
      success: boolean;
      project: Project;
    }>(`/projects/${projectId}`, data);
    return response.data.project;
  },

  deleteProject: async (projectId: string): Promise<Project> => {
    // Get the project before deleting to return it for optimistic updates
    const projectResponse = await apiClient.get<{
      success: boolean;
      project: Project;
    }>(`/projects/${projectId}`);

    await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/projects/${projectId}`);

    return projectResponse.data.project;
  },
};

// Hook for managing all projects
export function useProjects(filters?: ProjectFilters) {
  // Create a stable query key with proper serialization
  const queryKey = useMemo(() => {
    const baseKey = ["projects"];
    if (filters) {
      baseKey.push(JSON.stringify(filters));
    }
    return baseKey;
  }, [filters]);

  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useOptimisticQuery({
    queryKey,
    queryFn: () => projectsApi.getProjects(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Create project mutation
  const createMutation = useOptimisticMutation({
    mutationFn: projectsApi.createProject,
    optimisticUpdate: (variables) => ({
      type: "create" as const,
      data: {
        id: `temp-${Date.now()}`,
        user_id: "", // Will be set by backend
        name: variables.name,
        url: variables.url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      tempId: `temp-${Date.now()}`,
    }),
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to create project:", handleApiError(error));
    },
  });

  // Update project mutation
  const updateMutation = useOptimisticMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: UpdateProjectRequest;
    }) => projectsApi.updateProject(projectId, data),
    optimisticUpdate: ({ projectId, data }) => {
      const existingProject = projects.find((p) => p.id === projectId);
      if (!existingProject) throw new Error("Project not found");

      return {
        type: "update" as const,
        data: {
          ...existingProject,
          ...data,
          updated_at: new Date().toISOString(),
        },
      };
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to update project:", handleApiError(error));
    },
  });

  // Delete project mutation
  const deleteMutation = useOptimisticMutation({
    mutationFn: projectsApi.deleteProject,
    optimisticUpdate: (projectId) => {
      const existingProject = projects.find((p) => p.id === projectId);
      if (!existingProject) throw new Error("Project not found");

      return {
        type: "delete" as const,
        data: existingProject,
      };
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to delete project:", handleApiError(error));
    },
  });

  // Computed values
  const projectCount = projects.length;
  const isAnyMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return {
    // Data
    projects,
    projectCount,

    // Loading states
    isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAnyMutating,

    // Error states
    error,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,

    // Actions
    createProject: createMutation.mutate,
    updateProject: (projectId: string, data: UpdateProjectRequest) =>
      updateMutation.mutate({ projectId, data }),
    deleteProject: deleteMutation.mutate,
    refetch,

    // Helpers
    getProjectById: (projectId: string) =>
      projects.find((p) => p.id === projectId),
  };
}

// Hook for managing a single project
export function useProject(projectId: string) {
  const {
    data: project,
    isLoading,
    error,
    refetch,
  } = useOptimisticQuery({
    queryKey: ["projects", projectId],
    queryFn: () => projectsApi.getProject(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    project,
    isLoading,
    error,
    refetch,
    exists: !!project,
  };
}
