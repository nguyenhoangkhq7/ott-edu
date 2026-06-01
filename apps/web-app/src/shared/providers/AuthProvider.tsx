"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  getCurrentUser,
  login as loginApi,
  logout as logoutApi,
  refreshSession,
  type AuthUser,
  type LoginPayload,
} from "@/services/auth/auth.service";
import {
  clearAccessToken,
  getAccessToken,
  registerSession,
  updateActiveSessionToken,
  getActiveUserId,
  getSessionsMetadata,
} from "@/services/api/token-store";
import { subscribeSessionExpired } from "@/services/auth/session-events";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  switchAccount: (email: string) => Promise<void>;
};

const fallbackAuthContext: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isInitializing: false,
  login: async (payload: LoginPayload) => {
    const loginResponse = await loginApi(payload);
    registerSession(loginResponse.accessToken, loginResponse.refreshToken, loginResponse.user);
  },
  logout: async () => {
    try {
      await logoutApi();
    } finally {
      clearAccessToken();
      window.location.href = "/login";
    }
  },
  setUser: () => {
    // no-op in fallback mode
  },
  switchAccount: async () => {
    // no-op in fallback mode
  },
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeSessionExpired(() => {
      clearAccessToken();
      setUser(null);
      window.location.href = "/login";
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      try {
        const activeUserId = getActiveUserId();
        const refreshResult = await refreshSession(activeUserId);
        updateActiveSessionToken(refreshResult.accessToken, refreshResult.refreshToken);

        const currentUser = await getCurrentUser();
        
        // Full session anchoring: register session context in memory & sessionStorage
        registerSession(refreshResult.accessToken, refreshResult.refreshToken || "", currentUser);

        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        if (!getAccessToken()) {
          clearAccessToken();
          if (isMounted) {
            setUser(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    void bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      login: async (payload: LoginPayload) => {
        const loginResponse = await loginApi(payload);
        registerSession(
          loginResponse.accessToken,
          loginResponse.refreshToken,
          loginResponse.user
        );
        setUser(loginResponse.user);
      },
      logout: async () => {
        try {
          const activeUserId = getActiveUserId();
          await logoutApi(activeUserId);
        } finally {
          clearAccessToken();
          setUser(null);
          window.location.href = "/login";
        }
      },
      setUser,
      switchAccount: async (email: string) => {
        try {
          setIsInitializing(true);
          localStorage.setItem("active_user_id", email);

          // Get target role from saved session metadata in localStorage to route correctly
          const sessions = getSessionsMetadata();
          const targetSession = sessions.find((s) => s.email === email);
          const role = targetSession?.role || "ROLE_STUDENT";

          const isAdmin =
            role === "ROLE_ADMIN" ||
            role === "ROLE_SUPER_ADMIN" ||
            role.includes("ADMIN");

          window.location.href = isAdmin ? "/admin" : "/calendar";
        } catch (err) {
          console.error("Failed to switch account:", err);
          setIsInitializing(false);
        }
      },
    }),
    [isInitializing, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    console.error("Auth context missing. Falling back to stateless auth mode.");
    return fallbackAuthContext;
  }

  return context;
}
