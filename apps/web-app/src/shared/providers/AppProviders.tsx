"use client";

import { AuthProvider } from "@/shared/providers/AuthProvider";
import { AppProvider } from "@/shared/providers/AppContext"; // Thêm dòng import này

export default function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthProvider>
      {/* Bọc AppProvider của chúng ta vào đây */}
      <AppProvider>
        {children}
      </AppProvider>
    </AuthProvider>
  );
}