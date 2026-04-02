import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  type AuthUser,
  type LoginPayload,
  getCurrentUser,
  login as loginApi,
  logout as logoutApi,
  restoreSession,
} from "./auth.service";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrapSession() {
      try {
        // DEVELOPMENT: Auto-login with mock user to skip login screen
        const mockUser: AuthUser = {
          accountId: 1,
          email: "student@example.com",
          roles: ["ROLE_STUDENT"],
          firstName: "John",
          lastName: "Doe",
          code: "STU001",
          schoolId: 1,
          departmentId: 1,
          customSchool: null,
          customDepartment: null,
        };

        if (mounted) {
          setUser(mockUser);
        }
        return;

        // Uncomment below to use real authentication
        /*
        const restoredUser = await restoreSession();

        if (restoredUser) {
          const currentUser = await getCurrentUser();
          if (mounted) {
            setUser(currentUser);
          }
          return;
        }

        if (mounted) {
          setUser(null);
        }
        */
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    }

    void bootstrapSession();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      login: async (payload: LoginPayload) => {
        const nextUser = await loginApi(payload);
        setUser(nextUser);
      },
      logout: async () => {
        await logoutApi();
        setUser(null);
      },
      setUser,
    }),
    [isInitializing, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
