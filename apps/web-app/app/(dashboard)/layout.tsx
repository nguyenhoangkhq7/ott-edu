"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import AppLoader from "@/shared/components/common/AppLoader";
import { useAuth } from "@/shared/providers/AuthProvider";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isInitializing, router]);

  if (isInitializing) {
    return <AppLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
