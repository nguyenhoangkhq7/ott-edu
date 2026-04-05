"use client";

import { AuthProvider } from "@/shared/providers/AuthProvider";
import { AppProvider } from "@/shared/providers/AppContext";
export default function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </AppProvider>;
}
