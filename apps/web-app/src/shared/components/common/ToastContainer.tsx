/**
 * Toast Notification Display Component
 * Sử dụng hook useToast() để quản lý toast messages
 */

"use client";

import { Toast } from "@/shared/hooks/useToast";
import { X, AlertCircle, CheckCircle, Info, Loader } from "lucide-react";

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const getToastStyles = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          text: "text-green-800",
        };
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          text: "text-red-800",
        };
      case "loading":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: <Loader className="w-5 h-5 text-blue-600 animate-spin" />,
          text: "text-blue-800",
        };
      case "info":
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: <Info className="w-5 h-5 text-blue-600" />,
          text: "text-blue-800",
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg border pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-300 ${styles.bg} ${styles.border} shadow-lg max-w-md`}
          >
            {styles.icon}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${styles.text}`}>
                {toast.message}
              </p>
            </div>
            {toast.duration !== 0 && (
              <button
                onClick={() => onDismiss(toast.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
