"use client";

import { useState } from "react";
import Modal from "@/shared/components/ui/Modal";
import type { AdminUser } from "@/shared/types/admin";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<string>;
  user: AdminUser | null;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  onConfirm,
  user,
}: ResetPasswordModalProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleConfirm = async () => {
    setIsResetting(true);
    setError(null);
    try {
      const tempPass = await onConfirm();
      setTempPassword(tempPass);
    } catch (err) {
      console.error(err);
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopy = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setTempPassword(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Account Password" maxWidth="sm">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {!tempPassword ? (
          <>
            <div className="flex gap-4 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Reset password for {fullName}?</p>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  A temporary password will be generated for{" "}
                  <strong className="text-slate-700">@{user.username}</strong>.
                  Please share it securely with the user. The user should change their password upon their next login.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isResetting}
                className="px-4 py-2 rounded-md border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isResetting}
                className="flex items-center justify-center gap-2 px-4.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isResetting ? (
                  <>
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin text-white" fill="none" stroke="currentColor" strokeWidth="3">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2v4" />
                    </svg>
                    <span>Resetting...</span>
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Password Reset Successful</h4>
              <p className="text-xs text-slate-500 mt-1">Here is the temporary password for @{user.username}:</p>
            </div>

            {/* Display Temporary Password */}
            <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-xl p-3">
              <code className="flex-1 font-mono text-base font-bold text-center text-slate-800 tracking-wider">
                {tempPassword}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className={`p-2 rounded-lg border border-slate-200 transition-all flex items-center justify-center shrink-0 ${
                  copied 
                    ? "bg-emerald-600 border-emerald-600 text-white" 
                    : "bg-white hover:bg-slate-50 text-slate-600"
                }`}
                title="Copy Password"
              >
                {copied ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400">
              Please copy this password now. You will not be able to view it again once you close this window.
            </p>

            {/* Done Button */}
            <div className="flex items-center justify-center pt-4 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
