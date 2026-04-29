"use client";

import React, { useEffect, useState, useRef } from "react";
import { Send, Paperclip, Smile, X, AlertCircle } from "lucide-react";
import { Message, Attachment } from "../types";
import { uploadFileToChatService } from "../chatApi";

interface MessageInputProps {
  onSendMessage: (
    text: string,
    attachments?: Attachment[],
    replyToId?: string,
  ) => void;
  isSending?: boolean;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isSending = false,
  replyingTo,
  onCancelReply,
}) => {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false); // 👈 Drag-over state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const inputToolsRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null); // 👈 Ref cho drop zone
  const EMOJIS = ["😀", "😄", "😁", "😂", "😊", "😍", "😘", "👍", "👏", "🔥", "❤️", "🎉"];

  const handleSend = async () => {
    if (text.trim() || attachments.length > 0) {
      try {
        onSendMessage(
          text.trim(),
          attachments.length > 0 ? attachments : undefined,
          replyingTo?.id,
        );
        setText("");
        setAttachments([]);
        setUploadError(null);
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Failed to send message",
        );
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedAttachments: Attachment[] = [];

      for (const file of Array.from(files)) {
        try {
          // Validate file size (max 20MB)
          if (file.size > 20 * 1024 * 1024) {
            throw new Error(
              `File "${file.name}" is too large. Maximum size is 20MB.`,
            );
          }

          // Upload qua backend để tránh CORS browser -> S3
          const { fileUrl } = await uploadFileToChatService(file);

          // Add attachment to state
          uploadedAttachments.push({
            url: fileUrl,
            fileType: file.type,
            fileName: file.name,
          });
        } catch (error) {
          throw new Error(
            `Failed to upload "${file.name}": ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          );
        }
      }

      setAttachments((prev) => [...prev, ...uploadedAttachments]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  // 👇 Handlers cho Drag-and-Drop file upload
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Chỉ set isDragOver = false nếu drag leave khỏi container chính, không phải child
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Tái sử dụng logic upload từ file input
    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedAttachments: Attachment[] = [];

      for (const file of Array.from(files)) {
        try {
          // Validate file size (max 20MB)
          if (file.size > 20 * 1024 * 1024) {
            throw new Error(
              `File "${file.name}" is too large. Maximum size is 20MB.`,
            );
          }

          // Upload qua backend
          const { fileUrl } = await uploadFileToChatService(file);

          uploadedAttachments.push({
            url: fileUrl,
            fileType: file.type,
            fileName: file.name,
          });
        } catch (error) {
          throw new Error(
            `Failed to upload "${file.name}": ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          );
        }
      }

      setAttachments((prev) => [...prev, ...uploadedAttachments]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    const input = textInputRef.current;
    if (!input) {
      setText((prev) => `${prev}${emoji}`);
      setShowEmojiPicker(false);
      return;
    }

    const start = input.selectionStart ?? text.length;
    const end = input.selectionEnd ?? text.length;
    const next = `${text.slice(0, start)}${emoji}${text.slice(end)}`;
    setText(next);
    setShowEmojiPicker(false);

    requestAnimationFrame(() => {
      input.focus();
      const cursor = start + emoji.length;
      input.setSelectionRange(cursor, cursor);
    });
  };

  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!inputToolsRef.current) return;
      if (!inputToolsRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showEmojiPicker]);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-white p-4">
      {replyingTo && (
        <div className="flex items-center gap-2 rounded-xl border-l-4 border-blue-500 bg-blue-50 p-3">
          <div className="flex-1 text-sm">
            <p className="mb-1 text-xs text-slate-500">
              Đang trả lời cho một tin nhắn
            </p>
            <p className="truncate text-slate-700">
              {replyingTo.isRevoked
                ? "Tin nhắn đã bị thu hồi"
                : replyingTo.content}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="rounded p-1 transition-colors hover:bg-blue-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0" />
          <p>{uploadError}</p>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="ml-auto text-red-700 hover:text-red-900"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm"
            >
              <span className="max-w-xs truncate text-slate-700">
                📎 {attachment.fileName}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="ml-1 rounded p-0.5 hover:bg-slate-200"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone Container - cho Drag and Drop */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex items-center gap-2 rounded-2xl transition-all ${
          isDragOver
            ? "bg-blue-50 ring-2 ring-blue-400 ring-dashed"
            : "bg-transparent"
        }`}
      >
        <button
          type="button"
          onClick={handleAttachmentClick}
          disabled={isUploading}
          className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          {isUploading ? (
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
          ) : (
            <Paperclip size={20} />
          )}
        </button>

        <div
          ref={inputToolsRef}
          className="relative flex flex-1 items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 transition-colors focus-within:border-blue-400 focus-within:bg-white"
        >
          <input
            ref={textInputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            disabled={isSending || isUploading}
            className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="ml-2 p-1 text-slate-500 hover:text-slate-700"
          >
            <Smile size={20} />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-12 right-0 z-20 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="grid grid-cols-6 gap-1">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="rounded-lg p-2 text-lg hover:bg-slate-100"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={
            (!text.trim() && attachments.length === 0) ||
            isSending ||
            isUploading
          }
          className={`flex items-center justify-center rounded-full p-2.5 transition-colors ${
            (text.trim() || attachments.length > 0) &&
            !isSending &&
            !isUploading
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {isSending || isUploading ? (
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
          ) : (
            <Send size={18} />
          )}
        </button>

        {/* Drop Zone Text Feedback */}
        {isDragOver && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center rounded-2xl bg-blue-400/10">
            <p className="text-sm font-medium text-blue-600">
              Thả file để đính kèm
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/mp4,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
      />
    </div>
  );
};
