import { useCallback, useState } from "react";

interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

interface UseLoadingStateReturn extends LoadingState {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
}

export const useLoadingState = (
  initialLoading = false,
): UseLoadingStateReturn => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setError(null); // Clear error when starting new operation
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const withLoading = useCallback(
    async <T>(asyncFn: () => Promise<T>): Promise<T> => {
      setLoading(true);
      try {
        const result = await asyncFn();
        setLoading(false);
        return result;
      } catch (err) {
        setLoading(false);
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        throw err;
      }
    },
    [setLoading],
  );

  return {
    isLoading,
    error,
    setLoading,
    setError,
    clearError,
    withLoading,
  };
};
