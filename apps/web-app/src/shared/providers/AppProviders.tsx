"use client";

import { AuthProvider } from "@/shared/providers/AuthProvider";
import { ToastProvider } from "@/shared/providers/ToastProvider";

export default function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ToastProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ToastProvider>
  );
}
