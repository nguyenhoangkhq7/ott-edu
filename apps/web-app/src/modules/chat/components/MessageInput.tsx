"use client";

import React, { useState, useRef } from "react";
import { Send, Paperclip, Smile, X, AlertCircle } from "lucide-react";
import { Message, Attachment } from "../types";
import { getPresignedUrl, uploadToS3 } from "../chatApi";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

          // Get presigned URL from backend
          const { presignedUrl, fileUrl } = await getPresignedUrl(
            file.name,
            file.type,
          );

          // Upload file directly to S3
          await uploadToS3(presignedUrl, file);

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

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col gap-3">
      {/* Reply preview */}
      {replyingTo && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
          <div className="flex-1 text-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Đang trả lời cho một tin nhắn
            </p>
            <p className="text-gray-700 dark:text-gray-300 truncate">
              {replyingTo.isRevoked
                ? "Tin nhắn đã bị thu hồi"
                : replyingTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <p>{uploadError}</p>
          <button
            onClick={() => setUploadError(null)}
            className="ml-auto text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 text-sm"
            >
              <span className="truncate max-w-xs text-gray-700 dark:text-gray-300">
                📎 {attachment.fileName}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="ml-1 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAttachmentClick}
          disabled={isUploading}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
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

        <div className="flex-1 relative flex items-center bg-gray-100 dark:bg-gray-800 border border-transparent rounded-full px-4 py-2 focus-within:border-blue-500 transition-colors">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            disabled={isSending || isUploading}
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 disabled:opacity-50"
          />
          <button className="p-1 ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <Smile size={20} />
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={
            (!text.trim() && attachments.length === 0) ||
            isSending ||
            isUploading
          }
          className={`p-2.5 rounded-full flex items-center justify-center transition-colors ${
            (text.trim() || attachments.length > 0) &&
            !isSending &&
            !isUploading
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
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
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
      />
    </div>
  );
};
