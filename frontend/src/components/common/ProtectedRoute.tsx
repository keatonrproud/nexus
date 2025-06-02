import { useAuth } from "@/hooks";
import { Navigate, useLocation } from "react-router-dom";
import { LoadingSpinner } from "./LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
}) => {
  const { isAuthenticated, isLoading, error } = useAuth();
  const location = useLocation();

  // Show custom fallback or default loading while checking authentication
  if (isLoading) {
    return fallback || <LoadingSpinner fullScreen={true} minimal={true} />;
  }

  // If there's an authentication error or user is not authenticated, redirect to login
  if (error || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
