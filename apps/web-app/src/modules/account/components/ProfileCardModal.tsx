"use client";

import { useEffect } from "react";
import Image from "next/image";

interface ProfileCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  userRole: string;
  userStatus: "available" | "busy" | "away" | "offline";
  avatarUrl: string;
  linkedinUrl?: string;
}

export default function ProfileCardModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  userStatus,
  avatarUrl,
  linkedinUrl,
}: ProfileCardModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  const statusConfig = {
    available: { label: "Available", color: "bg-green-500", textColor: "text-green-600" },
    busy: { label: "Busy", color: "bg-red-500", textColor: "text-red-600" },
    away: { label: "Away", color: "bg-yellow-500", textColor: "text-yellow-600" },
    offline: { label: "Offline", color: "bg-slate-400", textColor: "text-slate-600" },
  };

  const status = statusConfig[userStatus];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4">
        <div className="relative rounded-xl bg-white shadow-2xl">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="p-6">
            <div className="mb-4 flex items-start gap-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
                <Image
                  src={avatarUrl}
                  alt={userName}
                  fill
                  className="object-cover"
                />
                <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${status.color}`} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-semibold text-slate-900">{userName}</h3>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${status.color}`} />
                  <span className={`text-xs font-medium ${status.textColor}`}>{status.label}</span>
                </div>
              </div>
            </div>

            <div className="mb-4 space-y-3 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contact Information
              </h4>

              <div className="flex items-start gap-3">
                <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500">Email</p>
                  <a
                    href={`mailto:${userEmail}`}
                    className="truncate text-sm text-blue-600 hover:underline block"
                  >
                    {userEmail}
                  </a>
                  <a href="#" className="mt-1 text-xs text-blue-600 hover:underline block">
                    Manage my contact information in Teams
                  </a>
                </div>
              </div>

              {linkedinUrl && (
                <div className="flex items-start gap-3 border-t border-slate-100 pt-3">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0 text-blue-600" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">LinkedIn</p>
                    <p className="text-sm text-slate-700">Several possible matches for Thành Tô</p>
                  </div>
                </div>
              )}

              <a href="#" className="block text-xs text-blue-600 hover:underline">
                Show more contact information
              </a>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Quick Actions
              </h4>
              <a href="#" className="block text-xs text-blue-600 hover:underline">
                Show profile matches
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
