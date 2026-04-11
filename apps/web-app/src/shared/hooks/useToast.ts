/**
 * Simple Toast Notification Hook
 * Usage: const { showToast, success, error, loading } = useToast();
 */

import { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "loading";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, 0 = no auto-dismiss
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 3000) => {
      const id = Math.random().toString(36).substr(2, 9);
      const toast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }

      return id;
    },
    []
  );

  const success = useCallback(
    (message: string, duration?: number) =>
      showToast(message, "success", duration ?? 3000),
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) =>
      showToast(message, "error", duration ?? 4000),
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) =>
      showToast(message, "info", duration ?? 3000),
    [showToast]
  );

  const loading = useCallback(
    (message: string) =>
      showToast(message, "loading", 0), // No auto-dismiss for loading
    [showToast]
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    showToast,
    success,
    error,
    info,
    loading,
    dismiss,
  };
}
