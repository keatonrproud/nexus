import { useAuth } from "@/hooks/useAuth";
import type { AuthUser } from "@/types";
import { createContext, useContext, type ReactNode } from "react";

interface AuthContextType {
  // User data
  user: AuthUser | null | undefined;
  isAuthenticated: boolean;

  // Loading states
  isLoading: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;

  // Error states
  error: unknown;

  // Actions
  login: (credential?: string) => void;
  logout: () => void;
  refetchUser: () => void;

  // Helper functions
  hasProjectAccess: (projectUserId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
