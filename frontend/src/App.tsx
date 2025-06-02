import {
  ErrorBoundary,
  LoadingSpinner,
  ProtectedRoute,
} from "@/components/common";
import { AuthProvider } from "@/contexts";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { theme } from "./theme";

// Lazy load pages for better performance
const Analytics = React.lazy(() => import("@/pages/Analytics"));
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Login = React.lazy(() => import("@/pages/Login"));
const ProjectBoard = React.lazy(() => import("@/pages/ProjectBoard"));

// Create a spinner fallback for Suspense
const SuspenseFallback = () => <LoadingSpinner fullScreen minimal />;

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      onError: (error) => {
        // Don't log 401 errors when on login page as they're expected
        const isOnLoginPage =
          typeof window !== "undefined" &&
          window.location.pathname.includes("/login");
        const is401Error =
          error &&
          typeof error === "object" &&
          "response" in error &&
          (error as any).response?.status === 401;

        if (
          process.env.NODE_ENV === "development" &&
          !(is401Error && isOnLoginPage)
        ) {
          console.error("Mutation error:", error);
        }
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <AuthProvider>
              <Routes>
                <Route
                  path="/login"
                  element={
                    <Suspense fallback={<SuspenseFallback />}>
                      <Login />
                    </Suspense>
                  }
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:projectId"
                  element={
                    <ProtectedRoute>
                      <ProjectBoard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:projectId/analytics"
                  element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
