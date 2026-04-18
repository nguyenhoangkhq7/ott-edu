"use client";

import Image from "next/image";
import { X, Mail, BadgeInfo, AtSign, Shield } from "lucide-react";
import { User } from "../types";

interface ChatUserProfileModalProps {
  user: User;
  onClose: () => void;
}

export function ChatUserProfileModal({ user, onClose }: ChatUserProfileModalProps) {
  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-r from-sky-500 via-cyan-500 to-blue-600" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900"
          aria-label="Đóng profile"
        >
          <X size={18} />
        </button>

        <div className="relative px-6 pb-6 pt-16">
          <div className="mx-auto flex w-fit flex-col items-center text-center">
            <div className="rounded-full bg-white p-1 shadow-lg ring-4 ring-white/70">
              <Image
                src={user.avatarUrl}
                alt={user.name}
                width={104}
                height={104}
                className="h-24 w-24 rounded-full object-cover"
              />
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-slate-900">
              {user.name}
            </h2>

            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {user.role && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  <Shield size={12} />
                  {user.role}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                <BadgeInfo size={12} />
                {user.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <Mail size={18} className="text-slate-500" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Email
                </p>
                <p className="truncate text-sm text-slate-800">
                  {user.email || "Chưa có email"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <AtSign size={18} className="text-slate-500" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Mã số / Code
                </p>
                <p className="truncate text-sm text-slate-800">
                  {user.code || "Chưa có mã số"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}