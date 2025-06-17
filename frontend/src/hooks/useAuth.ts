import apiClient, { handleApiError } from "@/services/apiClient";
import type { AuthUser, LoginResponse } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useOptimisticQuery } from "./useOptimisticQuery";

// Auth API functions
const authApi = {
  getCurrentUser: async (): Promise<AuthUser | null> => {
    try {
      const response = await apiClient.get("/auth/me");
      // Backend returns { success: true, user: {...} }
      return response.data.user;
    } catch (error) {
      // Handle 401 and 403 specifically - both indicate no valid authentication
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 || error.response?.status === 403)
      ) {
        return null;
      }
      throw error;
    }
  },

  validateSession: async (): Promise<AuthUser | null> => {
    try {
      const response = await apiClient.get("/auth/validate");
      return response.data.user;
    } catch (error) {
      // Handle 401 and 403 specifically - both indicate no valid authentication
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 || error.response?.status === 403)
      ) {
        return null;
      }
      throw error;
    }
  },

  login: async (payload?: { credential?: string }): Promise<LoginResponse> => {
    if (payload?.credential) {
      // Use credential-based login (OneTap)
      const response = await apiClient.post("/auth/google/callback", {
        credential: payload.credential,
      });
      return response.data;
    } else {
      // Use OAuth redirect - this will redirect the browser
      window.location.href = "/api/auth/google";
      // Return a pending response since we're redirecting
      return { success: false, user: {} as AuthUser };
    }
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  refreshToken: async (): Promise<void> => {
    await apiClient.post("/auth/refresh");
  },
};

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check if we're on the login page to handle expected auth failures
  const isOnLoginPage =
    typeof window !== "undefined" &&
    window.location.pathname.includes("/login");

  // Get current user with optimistic loading and improved caching for long sessions
  const {
    data: user,
    isLoading,
    error,
    refetch: refetchUser,
  } = useOptimisticQuery({
    queryKey: ["auth", "user"],
    queryFn: authApi.getCurrentUser,
    staleTime: 30 * 60 * 1000, // 30 minutes - longer than before for better persistence
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours - much longer to survive app restarts
    retry: (failureCount, error) => {
      // Don't retry on 401/403 errors (authentication failures)
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 || error.response?.status === 403)
      ) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    // Always enable - we want to check auth status on login page too (for redirects)
    enabled: true,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // If we get a valid response (OneTap success), update user data and redirect
      if (data && data.user && data.success) {
        console.log("Login successful, updating user data");
        queryClient.setQueryData(["auth", "user"], data.user);
        navigate("/");
      }
    },
    onError: (error) => {
      console.error("Login failed:", error);
      // For OneTap failures, we might want to fallback to OAuth
      const isOneTapError =
        error instanceof Error && error.message.includes("credential");
      if (isOneTapError) {
        console.log("OneTap failed, falling back to OAuth");
        // Fallback to traditional OAuth
        setTimeout(() => {
          window.location.href = "/api/auth/google";
        }, 1000);
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Redirect to login
      navigate("/login");
    },
    onError: (error) => {
      console.error("Logout failed:", handleApiError(error));
      // Even if logout fails, clear cache and redirect
      queryClient.clear();
      navigate("/login");
    },
  });

  // Computed values
  const isAuthenticated = !!user;
  const isLoggingIn = loginMutation.isPending;
  const isLoggingOut = logoutMutation.isPending;

  // Enhanced login function to support both credential and OAuth
  const login = (credential?: string) => {
    if (credential) {
      // Use credential flow (should not happen with OneTap removed, but keep for compatibility)
      console.log("Login called with credential");
      loginMutation.mutate({ credential });
    } else {
      // Use traditional OAuth redirect - this is the flow we will use now
      console.log("Login called with OAuth redirect");
      loginMutation.mutate(undefined);
    }
  };

  return {
    // User data
    user,
    isAuthenticated,

    // Loading states
    isLoading,
    isLoggingIn,
    isLoggingOut,

    // Error states - only show errors if not expected 401s/403s on login page
    error:
      !isOnLoginPage ||
      !axios.isAxiosError(error) ||
      (error.response?.status !== 401 && error.response?.status !== 403)
        ? error || loginMutation.error || logoutMutation.error
        : null,

    // Actions
    login,
    logout: logoutMutation.mutate,
    refetchUser,

    // Helper to check if user has access to a project
    hasProjectAccess: (projectUserId: string) => {
      return user?.id === projectUserId;
    },
  };
}
