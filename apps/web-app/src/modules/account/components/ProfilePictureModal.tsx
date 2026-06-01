"use client";

import { useState } from "react";
import Image from "next/image";
import Modal from "@/shared/components/ui/Modal";

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl: string;
  userName: string;
  userEmail: string;
}

export default function ProfilePictureModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  userName,
  userEmail,
}: ProfilePictureModalProps) {
  const [previewUrl] = useState(currentAvatarUrl);

  const handleUploadPhoto = () => {
    console.log("Upload photo");
  };

  const handleChooseFromGallery = () => {
    console.log("Choose from gallery");
  };

  const handleRemovePhoto = () => {
    console.log("Remove photo");
  };

  const handleSave = () => {
    console.log("Save changes");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change your profile picture" maxWidth="sm">
      <div className="flex flex-col items-center">
        <div className="relative mb-4 h-32 w-32 overflow-hidden rounded-full">
          <Image
            src={previewUrl}
            alt={userName}
            fill
            className="object-cover"
          />
        </div>

        <h3 className="text-xl font-semibold text-slate-900">{userName}</h3>
        <p className="mt-1 text-sm text-slate-500">{userEmail}</p>

        <p className="mt-4 max-w-sm text-center text-xs text-slate-400">
          Your profile picture is visible to everyone in your organization and helps people recognize you.
        </p>

        <div className="mt-6 flex w-full flex-col gap-3">
          <button
            onClick={handleUploadPhoto}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload photo
          </button>

          <button
            onClick={handleChooseFromGallery}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
            Choose from gallery
          </button>

          <button
            onClick={handleRemovePhoto}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Remove photo
          </button>
        </div>

        <div className="mt-6 flex w-full gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Save changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
