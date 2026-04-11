/**
 * Toast Context & Provider
 * Provides global toast management across the app
 */

"use client";

import React, { createContext, useContext } from "react";
import { useToast, Toast } from "@/shared/hooks/useToast";
import ToastContainer from "@/shared/components/common/ToastContainer";

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: "success" | "error" | "info" | "loading", duration?: number) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  loading: (message: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toastHook = useToast();

  const value: ToastContextType = {
    toasts: toastHook.toasts,
    showToast: toastHook.showToast,
    success: toastHook.success,
    error: toastHook.error,
    info: toastHook.info,
    loading: toastHook.loading,
    dismiss: toastHook.dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toastHook.toasts} onDismiss={toastHook.dismiss} />
    </ToastContext.Provider>
  );
}

export function useGlobalToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useGlobalToast must be used within ToastProvider");
  }
  return context;
}
