"use client";

import React, { useState } from "react";
import { LinkPreview } from "../types";
import { ExternalLink } from "lucide-react";

interface LinkPreviewCardProps {
  linkPreview: LinkPreview;
  isOwnMessage?: boolean;
}

/**
 * LinkPreviewCard Component
 * Hiển thị link preview dưới dạng một thẻ đẹp mắt (tương tự Zalo/Facebook)
 * - Thumbnail ảnh bên trái (hoặc top nếu mobile)
 * - Title + Description bên phải
 * - Nhấn vào để mở URL trong tab mới
 */
export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({
  linkPreview,
  isOwnMessage = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // Xử lý fallback khi ảnh không load được
  const handleImageError = () => {
    setImageError(true);
  };

  // Rút ngắn domain từ URL để hiển thị
  const getDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <a
      href={linkPreview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group mt-3 min-w-0 w-full flex overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md ${
        isOwnMessage
          ? "border-blue-400/30 bg-blue-50/50 hover:bg-blue-100/50"
          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
      }`}
    >
      {/* Thumbnail Image - Bên trái */}
      {linkPreview.image && !imageError ? (
        <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden bg-slate-200">
          <img
            src={linkPreview.image}
            alt="Link preview"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={handleImageError}
          />
        </div>
      ) : (
        // Fallback placeholder khi không có ảnh
        <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400">
          <ExternalLink size={32} className="text-white/60" />
        </div>
      )}

      {/* Content - Bên phải */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
        {/* Title */}
        <div className="mb-1">
          {linkPreview.title ? (
            <h4
              className={`truncate font-semibold text-sm leading-snug ${
                isOwnMessage ? "text-slate-900" : "text-slate-900"
              }`}
            >
              {linkPreview.title}
            </h4>
          ) : (
            <h4 className="truncate font-semibold text-sm text-slate-500">
              Link
            </h4>
          )}
        </div>

        {/* Description */}
        <div className="mb-2 min-h-0 flex-1">
          {linkPreview.description ? (
            <p
              className={`line-clamp-2 text-xs leading-snug ${
                isOwnMessage ? "text-slate-600" : "text-slate-500"
              }`}
            >
              {linkPreview.description}
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              {getDomainFromUrl(linkPreview.url)}
            </p>
          )}
        </div>

        {/* Domain URL */}
        <p
          className={`truncate text-xs ${
            isOwnMessage
              ? "text-blue-600 group-hover:text-blue-700"
              : "text-blue-500 group-hover:text-blue-600"
          }`}
        >
          {getDomainFromUrl(linkPreview.url)}
        </p>
      </div>
    </a>
  );
};
