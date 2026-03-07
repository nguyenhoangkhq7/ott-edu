"use client";

import { AuthProvider } from "@/shared/providers/AuthProvider";

export default function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthProvider>{children}</AuthProvider>;
}
