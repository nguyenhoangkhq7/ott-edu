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
  setAccessToken,
  registerSession,
  updateActiveSessionToken,
  getActiveUser,
  getRefreshToken,
} from "@/services/api/token-store";
import { subscribeSessionExpired } from "@/services/auth/session-events";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
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
        const token = getRefreshToken();
        if (!token) {
          throw new Error("No active refresh token in sessionStorage");
        }
        const refreshResult = await refreshSession(token);
        updateActiveSessionToken(refreshResult.accessToken, refreshResult.refreshToken);

        const currentUser = await getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        // Avoid clobbering a successful manual login that may complete
        // while the initial bootstrap refresh request is still in flight.
        if (!getAccessToken()) {
          clearAccessToken();
          if (isMounted) {
            setUser(null);
          }
        } else {
          // If we failed to refresh but have an active session in local store, fetch it
          const activeUser = getActiveUser();
          if (isMounted && activeUser) {
            setUser(activeUser);
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
          await logoutApi();
        } finally {
          clearAccessToken();
          setUser(null);
          window.location.href = "/login";
        }
      },
      setUser,
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
