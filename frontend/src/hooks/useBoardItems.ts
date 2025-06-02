import apiClient, { handleApiError } from "@/services/apiClient";
import type {
  BoardFilters,
  BoardItem,
  BoardStats,
  CreateBoardItemRequest,
  UpdateBoardItemRequest,
} from "@/types";
import { generateTempId } from "@/utils/uuid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

// Board items API functions
const boardItemsApi = {
  getBoardItems: async (
    projectId: string,
    filters?: BoardFilters,
  ): Promise<BoardItem[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.search) params.append("search", filters.search);

    try {
      const response = await apiClient.get<{
        success: boolean;
        items: BoardItem[];
        total: number;
        page: number;
        limit: number;
      }>(`/board/${projectId}/items?${params.toString()}`);

      // Ensure we return an array even if the response doesn't have the expected structure
      if (response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      } else {
        console.error(
          "Invalid response format from board items API:",
          response.data,
        );
        return [];
      }
    } catch (error) {
      console.error("Error fetching board items:", error);
      return [];
    }
  },

  getBoardItem: async (
    projectId: string,
    itemId: string,
  ): Promise<BoardItem> => {
    const response = await apiClient.get<{
      success: boolean;
      item: BoardItem;
    }>(`/board/${projectId}/${itemId}`);
    return response.data.item;
  },

  getBoardStats: async (projectId: string): Promise<BoardStats> => {
    const response = await apiClient.get<{
      success: boolean;
      stats: BoardStats;
    }>(`/board/${projectId}/stats`);
    return response.data.stats;
  },

  createBoardItem: async (
    projectId: string,
    data: CreateBoardItemRequest,
  ): Promise<BoardItem> => {
    const response = await apiClient.post<{
      success: boolean;
      item: BoardItem;
    }>(`/board/${projectId}`, data);
    return response.data.item;
  },

  updateBoardItem: async (
    projectId: string,
    itemId: string,
    data: UpdateBoardItemRequest,
  ): Promise<BoardItem> => {
    const response = await apiClient.put<{
      success: boolean;
      item: BoardItem;
    }>(`/board/${projectId}/${itemId}`, data);
    return response.data.item;
  },

  deleteBoardItem: async (
    projectId: string,
    itemId: string,
  ): Promise<BoardItem> => {
    // Get the item before deleting to return it for optimistic updates
    const itemResponse = await apiClient.get<{
      success: boolean;
      item: BoardItem;
    }>(`/board/${projectId}/${itemId}`);

    await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/board/${projectId}/${itemId}`);

    return itemResponse.data.item;
  },
};

// Hook for managing board items in a project
export function useBoardItems(projectId: string, filters?: BoardFilters) {
  // Create a stable query key with proper serialization
  const queryKey = useMemo(() => {
    const baseKey = ["board-items", projectId];
    if (filters) {
      baseKey.push(JSON.stringify(filters));
    }
    return baseKey;
  }, [projectId, filters]);

  const queryClient = useQueryClient();

  const {
    data: boardItems = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => boardItemsApi.getBoardItems(projectId, filters),
    enabled: !!projectId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Ensure boardItems is always an array
  const safeboardItems = Array.isArray(boardItems) ? boardItems : [];

  // Create board item mutation with optimistic updates
  const createMutation = useMutation({
    mutationFn: (data: CreateBoardItemRequest) => {
      return boardItemsApi.createBoardItem(projectId, data);
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      const tempId = generateTempId();
      const optimisticItem: BoardItem = {
        id: tempId,
        project_id: projectId,
        title: variables.title,
        description: variables.description,
        type: variables.type,
        priority: variables.priority || "later",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData(queryKey, (old: BoardItem[] = []) => [
        ...old,
        optimisticItem,
      ]);

      return { previousItems, tempId };
    },
    onError: (err, _variables, context) => {
      // If the mutation fails, rollback
      if (context?.previousItems) {
        queryClient.setQueryData(queryKey, context.previousItems);
      }
      console.error("Failed to create board item:", handleApiError(err));
    },
    onSuccess: (realItem, _variables, context) => {
      // Replace the temporary item with the real one
      queryClient.setQueryData(queryKey, (old: BoardItem[] = []) =>
        old.map((item) => (item.id === context?.tempId ? realItem : item)),
      );
    },
  });

  // Update board item mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: UpdateBoardItemRequest;
    }) => boardItemsApi.updateBoardItem(projectId, itemId, data),
    onMutate: async ({ itemId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (old: BoardItem[] = []) =>
        old.map((item) =>
          item.id === itemId
            ? { ...item, ...data, updated_at: new Date().toISOString() }
            : item,
        ),
      );

      return { previousItems };
    },
    onError: (err, _variables, context) => {
      // If the mutation fails, rollback
      if (context?.previousItems) {
        queryClient.setQueryData(queryKey, context.previousItems);
      }
      console.error("Failed to update board item:", handleApiError(err));
    },
    onSuccess: (realItem) => {
      // Update with the real server response
      queryClient.setQueryData(queryKey, (old: BoardItem[] = []) =>
        old.map((item) => (item.id === realItem.id ? realItem : item)),
      );
    },
  });

  // Delete board item mutation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: (itemId: string) =>
      boardItemsApi.deleteBoardItem(projectId, itemId),
    onMutate: async (itemId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (old: BoardItem[] = []) =>
        old.filter((item) => item.id !== itemId),
      );

      return { previousItems };
    },
    onError: (err, _itemId, context) => {
      // If the mutation fails, rollback
      if (context?.previousItems) {
        queryClient.setQueryData(queryKey, context.previousItems);
      }
      console.error("Failed to delete board item:", handleApiError(err));
    },
    onSuccess: () => {
      // Item is already removed optimistically, nothing to do
    },
  });

  // Computed values using real items
  const itemCount = safeboardItems.length;
  const bugCount = safeboardItems.filter((item) => item.type === "bug").length;
  const ideaCount = safeboardItems.filter(
    (item) => item.type === "idea",
  ).length;

  const isAnyMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return {
    // Data - using real board items (optimistic updates are in the cache)
    boardItems: safeboardItems,
    itemCount,
    bugCount,
    ideaCount,

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
    createBoardItem: createMutation.mutate,
    updateBoardItem: (itemId: string, data: UpdateBoardItemRequest) =>
      updateMutation.mutate({ itemId, data }),
    deleteBoardItem: deleteMutation.mutate,
    refetch,

    // Helpers
    getBoardItemById: (itemId: string) =>
      safeboardItems.find((item) => item.id === itemId),
    getBoardItemsByType: (type: "bug" | "idea") =>
      safeboardItems.filter((item) => item.type === type),
  };
}

// Hook for managing a single board item
export function useBoardItem(projectId: string, itemId: string) {
  const {
    data: boardItem,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["board-items", projectId, itemId],
    queryFn: () => boardItemsApi.getBoardItem(projectId, itemId),
    enabled: !!projectId && !!itemId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    boardItem,
    isLoading,
    error,
    refetch,
    exists: !!boardItem,
  };
}

// Hook to get board statistics for a project
export function useBoardStats(projectId: string) {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["board-stats", projectId],
    queryFn: () => boardItemsApi.getBoardStats(projectId),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}

// Hook for managing board items across ALL projects
export function useAllBoardItems(filters?: BoardFilters) {
  // Create a stable query key with proper serialization
  const queryKey = useMemo(() => {
    const baseKey = ["all-board-items"];
    if (filters) {
      baseKey.push(JSON.stringify(filters));
    }
    return baseKey;
  }, [filters]);

  const queryClient = useQueryClient();

  const {
    data: boardItems = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append("type", filters.type);
      if (filters?.priority) params.append("priority", filters.priority);
      if (filters?.search) params.append("search", filters.search);

      try {
        const response = await apiClient.get<{
          success: boolean;
          items: BoardItem[];
          total: number;
        }>(`/board/all/items?${params.toString()}`);

        // Ensure we return an array even if the response doesn't have the expected structure
        if (response.data && Array.isArray(response.data.items)) {
          return response.data.items;
        } else {
          console.error(
            "Invalid response format from all board items API:",
            response.data,
          );
          return [];
        }
      } catch (error) {
        console.error("Error fetching all board items:", error);
        return [];
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Ensure boardItems is always an array
  const safeBoardItems = Array.isArray(boardItems) ? boardItems : [];

  // Update board item mutation - need project ID for individual updates
  const updateMutation = useMutation({
    mutationFn: ({
      projectId,
      itemId,
      data,
    }: {
      projectId: string;
      itemId: string;
      data: UpdateBoardItemRequest;
    }) => boardItemsApi.updateBoardItem(projectId, itemId, data),
    onMutate: async ({ itemId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (old: BoardItem[] = []) =>
        old.map((item) =>
          item.id === itemId
            ? { ...item, ...data, updated_at: new Date().toISOString() }
            : item,
        ),
      );

      return { previousItems };
    },
    onError: (err, _variables, context) => {
      // If the mutation fails, rollback
      if (context?.previousItems) {
        queryClient.setQueryData(queryKey, context.previousItems);
      }
      console.error("Failed to update board item:", handleApiError(err));
    },
    onSuccess: (realItem) => {
      // Update with the real server response
      queryClient.setQueryData(queryKey, (old: BoardItem[] = []) =>
        old.map((item) => (item.id === realItem.id ? realItem : item)),
      );
    },
  });

  // Delete board item mutation
  const deleteMutation = useMutation({
    mutationFn: ({
      projectId,
      itemId,
    }: {
      projectId: string;
      itemId: string;
    }) => boardItemsApi.deleteBoardItem(projectId, itemId),
    onMutate: async ({ itemId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (old: BoardItem[] = []) =>
        old.filter((item) => item.id !== itemId),
      );

      return { previousItems };
    },
    onError: (err, _variables, context) => {
      // If the mutation fails, rollback
      if (context?.previousItems) {
        queryClient.setQueryData(queryKey, context.previousItems);
      }
      console.error("Failed to delete board item:", handleApiError(err));
    },
    onSuccess: () => {
      // Item is already removed optimistically, nothing to do
    },
  });

  // Computed values using real items
  const itemCount = safeBoardItems.length;
  const bugCount = safeBoardItems.filter((item) => item.type === "bug").length;
  const ideaCount = safeBoardItems.filter(
    (item) => item.type === "idea",
  ).length;

  const isAnyMutating = updateMutation.isPending || deleteMutation.isPending;

  return {
    // Data - using real board items (optimistic updates are in the cache)
    boardItems: safeBoardItems,
    itemCount,
    bugCount,
    ideaCount,

    // Loading states
    isLoading,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAnyMutating,

    // Error states
    error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,

    // Actions
    updateBoardItem: (
      projectId: string,
      itemId: string,
      data: UpdateBoardItemRequest,
    ) => updateMutation.mutate({ projectId, itemId, data }),
    deleteBoardItem: (projectId: string, itemId: string) =>
      deleteMutation.mutate({ projectId, itemId }),
    refetch,

    // Helpers
    getBoardItemById: (itemId: string) =>
      safeBoardItems.find((item) => item.id === itemId),
    getBoardItemsByType: (type: "bug" | "idea") =>
      safeBoardItems.filter((item) => item.type === type),
    getBoardItemsByProject: (projectId: string) =>
      safeBoardItems.filter((item) => item.project_id === projectId),
  };
}
