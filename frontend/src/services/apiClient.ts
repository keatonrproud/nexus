import type { AxiosInstance, AxiosResponse } from "axios";
import axios, { AxiosError } from "axios";

// Type for API error response
interface ApiErrorResponse {
  message?: string;
  error?: string;
}

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: "/api", // Proxy will handle routing to backend
  timeout: 30000, // Increased timeout for cold starts
  withCredentials: true, // Important for cookie-based auth
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function to check if we're on login page
const isOnLoginPage = () =>
  typeof window !== "undefined" && window.location.pathname.includes("/login");

// Track if we're currently refreshing to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any request modifications here
    if (process.env.NODE_ENV === "development") {
      // Don't log auth/me requests when on login page to avoid noise from expected 401s
      const isAuthMeRequest = config.url?.includes("/auth/me");
      const shouldSkipLogging = isAuthMeRequest && isOnLoginPage();

      if (!shouldSkipLogging) {
        console.log(
          `Making ${config.method?.toUpperCase()} request to ${config.url}`,
        );
      }
    }
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === "development") {
      console.error("Request error:", error);
    }
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Handle successful responses
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config;
    const isOnLogin = isOnLoginPage();

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && originalRequest) {
      // Don't retry if this is already a refresh request to prevent infinite loop
      if (originalRequest.url?.includes("/auth/refresh")) {
        isRefreshing = false;
        processQueue(error, null);

        // Only log refresh failures if not on login page (where they're expected)
        if (process.env.NODE_ENV === "development" && !isOnLogin) {
          console.error("Token refresh failed:", error);
        }

        // Redirect to login for refresh failures (only if not already on login page)
        if (typeof window !== "undefined" && !isOnLogin) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // Don't retry if we've already tried to refresh this request
      if ((originalRequest as any)._retry) {
        if (typeof window !== "undefined" && !isOnLogin) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // Don't attempt token refresh if we're on the login page - these 401s are expected
      if (isOnLogin) {
        // Silently handle 401s on login page without logging or attempting refresh
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      (originalRequest as any)._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        await apiClient.post("/auth/refresh");
        processQueue(null, "success");
        isRefreshing = false;

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        processQueue(refreshError, null);
        isRefreshing = false;

        if (process.env.NODE_ENV === "development") {
          console.error("Token refresh failed:", refreshError);
        }
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    // Don't log 401 errors when on login page as they're expected
    const is401OnLogin = error.response?.status === 401 && isOnLogin;
    const isAuthMeRequest = originalRequest?.url?.includes("/auth/me");

    // Be extra quiet about auth/me 401s on login page
    if (
      process.env.NODE_ENV === "development" &&
      !(is401OnLogin && isAuthMeRequest)
    ) {
      // Only log if it's not a 401 on login page OR not an auth/me request
      if (!is401OnLogin) {
        console.error("API Error:", {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url,
        });
      }
    }

    return Promise.reject(error);
  },
);

// Helper function to handle API errors consistently
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error as AxiosError<ApiErrorResponse>;
    return (
      apiError.response?.data?.message ||
      apiError.message ||
      "An unexpected error occurred"
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
};

// Helper function for retry logic
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> => {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, i)),
        );
      }
    }
  }

  throw lastError;
};

export default apiClient;
