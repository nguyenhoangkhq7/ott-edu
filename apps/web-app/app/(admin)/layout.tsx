"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/providers/AuthProvider";
import AdminSidebar from "@/modules/admin/components/AdminSidebar";
import AdminHeader from "@/modules/admin/components/AdminHeader";
import AppLoader from "@/shared/components/common/AppLoader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isInitializing } = useAuth();

  useEffect(() => {
    if (!isInitializing) {
      if (!user) {
        router.replace("/login");
      } else {
        const isAdmin = user.roles?.some(
          (role) =>
            role === "ROLE_ADMIN" ||
            role === "ROLE_SUPER_ADMIN" ||
            role.includes("ADMIN")
        );
        if (!isAdmin) {
          // If not admin, redirect to normal user dashboard /chat or /teams
          router.replace("/chat");
        }
      }
    }
  }, [isInitializing, user, router]);

  if (isInitializing || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <AppLoader />
      </div>
    );
  }

  // Check admin role
  const isAdmin = user.roles?.some(
    (role) =>
      role === "ROLE_ADMIN" ||
      role === "ROLE_SUPER_ADMIN" ||
      role.includes("ADMIN")
  );

  if (!isAdmin) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="mt-2 text-sm text-slate-500">Redirecting to user console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-white text-slate-900 overflow-hidden font-sans">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
          <div className="page-transition mx-auto max-w-7xl space-y-8 pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
