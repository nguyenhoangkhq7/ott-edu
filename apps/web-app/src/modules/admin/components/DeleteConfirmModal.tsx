"use client";

import { useState } from "react";
import Modal from "@/shared/components/ui/Modal";
import type { AdminUser } from "@/shared/types/admin";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  user: AdminUser | null;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  user,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to delete user. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Account" maxWidth="sm">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-4 items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Are you absolutely sure?</p>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              This will permanently delete the account for{" "}
              <strong className="text-slate-700">
                {fullName} (@{user.username})
              </strong>
              . This action cannot be undone, and all associated messages and class data will be affected.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-md border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center justify-center gap-2 px-4.5 py-2 rounded-md bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin text-white" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2v4" />
                </svg>
                <span>Deleting...</span>
              </>
            ) : (
              "Yes, Delete Account"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
