import { useCallback, useState } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'loading';
  duration?: number;
}

/**
 * Custom hook for managing toast notifications
 * Provides methods to show success, error, and loading toasts
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: 'success' | 'error' | 'loading', duration?: number) => {
      const id = generateId();
      setToasts((prevToasts) => [
        ...prevToasts,
        { id, message, type, duration },
      ]);

      // Auto-dismiss after duration (except for loading toasts)
      if (duration && type !== 'loading') {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [generateId, dismiss]
  );

  const success = useCallback(
    (message: string, duration = 3000) => {
      return addToast(message, 'success', duration);
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, duration = 4000) => {
      return addToast(message, 'error', duration);
    },
    [addToast]
  );

  const loading = useCallback(
    (message: string) => {
      return addToast(message, 'loading');
    },
    [addToast]
  );

  return {
    toasts,
    success,
    error,
    loading,
    dismiss,
  };
}
