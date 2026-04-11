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
import { clearAccessToken, getAccessToken, setAccessToken } from "@/services/api/token-store";
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
    setAccessToken(loginResponse.accessToken);
  },
  logout: async () => {
    try {
      await logoutApi();
    } finally {
      clearAccessToken();
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
    });

    return unsubscribe;
  }, []);

 useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      try {
        // 1. Nếu localStorage đã có token, thử lấy user luôn
        const currentToken = getAccessToken();
        if (currentToken) {
           const currentUser = await getCurrentUser();
           if (isMounted) {
             setUser(currentUser);
             setIsInitializing(false);
           }
           return; // Thoát sớm nếu thành công
        }

        // 2. Nếu không có token (hoặc token lỗi phía trên nhảy xuống catch), thử refresh
        const refreshResult = await refreshSession();
        setAccessToken(refreshResult.accessToken);
        const currentUser = await getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }

      } catch {
        // Nếu refresh cũng thất bại -> Xóa phiên
        clearAccessToken();
        if (isMounted) {
          setUser(null);
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
        setAccessToken(loginResponse.accessToken);
        setUser(loginResponse.user);
      },
      logout: async () => {
        try {
          await logoutApi();
        } finally {
          clearAccessToken();
          setUser(null);
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
