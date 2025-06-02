import type { LoadingState, OptimisticUpdate } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface UseOptimisticQueryOptions<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  retry?:
    | boolean
    | number
    | ((failureCount: number, error: unknown) => boolean);
}

// Type constraint for entities with ID
interface EntityWithId {
  id: string;
}

interface UseOptimisticMutationOptions<TData extends EntityWithId, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  optimisticUpdate?: (variables: TVariables) => OptimisticUpdate<TData>;
}

// Custom hook for optimistic queries with loading states
export function useOptimisticQuery<T>({
  queryKey,
  queryFn,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutes
  cacheTime = 10 * 60 * 1000, // 10 minutes
  retry,
}: UseOptimisticQueryOptions<T>) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    error: undefined,
  });

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      setLoadingState({ isLoading: true, error: undefined });
      try {
        const result = await queryFn();
        setLoadingState({ isLoading: false, error: undefined });
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        setLoadingState({ isLoading: false, error: errorMessage });
        throw error;
      }
    },
    enabled,
    staleTime,
    gcTime: cacheTime,
    retry: retry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    ...query,
    loadingState,
    isLoading: query.isLoading || loadingState.isLoading,
    error: query.error || loadingState.error,
  };
}

// Custom hook for optimistic mutations
export function useOptimisticMutation<TData extends EntityWithId, TVariables>({
  mutationFn,
  onSuccess,
  onError,
  optimisticUpdate,
}: UseOptimisticMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const [isOptimistic, setIsOptimistic] = useState(false);

  const mutation = useMutation({
    mutationFn,
    onMutate: async (variables) => {
      if (optimisticUpdate) {
        setIsOptimistic(true);
        const update = optimisticUpdate(variables);

        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: [update.type] });

        // Snapshot the previous value
        const previousData = queryClient.getQueryData([update.type]);

        // Let the calling code handle the optimistic UI update
        return { previousData, update };
      }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousData && optimisticUpdate) {
        const update = optimisticUpdate(variables);
        queryClient.setQueryData([update.type], context.previousData);
      }
      setIsOptimistic(false);
      onError?.(error as Error, variables);
    },
    onSuccess: (data, variables) => {
      setIsOptimistic(false);

      // Update cache with real server data
      if (optimisticUpdate) {
        const update = optimisticUpdate(variables);
        queryClient.setQueryData([update.type], (old: TData[]) => {
          if (!old) return [data];

          // Use real server data to update the cache
          switch (update.type) {
            case "create":
              return [...old.filter((item) => item.id !== update.tempId), data];
            case "update":
              return old.map((item) => (item.id === data.id ? data : item));
            case "delete":
              return old.filter((item) => item.id !== data.id);
            default:
              return old;
          }
        });
      }

      onSuccess?.(data, variables);
    },
    onSettled: () => {
      setIsOptimistic(false);
      // Removed query invalidations - let optimistic updates stand
      // The cache will naturally sync when needed
    },
  });

  return {
    ...mutation,
    isOptimistic,
    mutateWithOptimism: mutation.mutate,
  };
}

// Hook for managing loading states across multiple queries
export function useLoadingStates(
  queries: Array<{ isLoading: boolean; error?: unknown }>,
) {
  const isAnyLoading = queries.some((query) => query.isLoading);
  const errors = queries.map((query) => query.error).filter(Boolean);
  const hasErrors = errors.length > 0;

  return {
    isLoading: isAnyLoading,
    hasErrors,
    errors,
    firstError: errors[0],
  };
}

// Hook for debounced search
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
