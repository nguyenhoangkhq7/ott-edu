import { useContext } from "react";
import { AuthContext } from "@/shared/providers/AuthProvider";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useHasRole(role: string | string[]): boolean {
  const { user } = useAuth();
  if (!user?.roles) return false;

  const roles = Array.isArray(role) ? role : [role];
  return roles.some((r) => user.roles.includes(r));
}

export function useIsTeacher(): boolean {
  return useHasRole("ROLE_TEACHER");
}

export function useIsStudent(): boolean {
  return useHasRole("ROLE_STUDENT");
}

export function useIsAdmin(): boolean {
  return useHasRole("ROLE_ADMIN");
}
