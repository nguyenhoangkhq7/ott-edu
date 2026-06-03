"use client";

import React, { useEffect, useState, useRef } from "react";
import { Send, Paperclip, Smile, X, AlertCircle, Lock } from "lucide-react";
import { Message, Attachment, User } from "../types";
import { uploadFileToChatService } from "../chatApi";
import { Socket } from "socket.io-client";

interface MessageInputProps {
  onSendMessage: (
    text: string,
    attachments?: Attachment[],
    replyToId?: string,
    mentions?: string[],
  ) => void;
  isSending?: boolean;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  socket?: Socket | null;
  conversationId?: string;
  isReadOnly?: boolean;
  participants?: User[];
  currentUser?: User | null;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isSending = false,
  replyingTo,
  onCancelReply,
  socket,
  conversationId,
  isReadOnly = false,
  participants = [],
  currentUser = null,
}) => {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false); // 👈 Drag-over state

  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionedUsers, setMentionedUsers] = useState<User[]>([]);

  const filteredParticipants = React.useMemo(() => {
    if (!participants) return [];
    const otherMembers = participants.filter((p) => p.id !== currentUser?.id);
    if (!mentionQuery) return otherMembers;
    const query = mentionQuery.toLowerCase();
    return otherMembers.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      (p.email && p.email.toLowerCase().includes(query))
    );
  }, [participants, mentionQuery, currentUser]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredParticipants.length]);

  const detectMention = (val: string, cursor: number) => {
    const textBeforeCursor = val.slice(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    if (lastAtIdx === -1) {
      setShowMentionPopup(false);
      return;
    }

    const textAfterAt = textBeforeCursor.slice(lastAtIdx + 1);
    const isAtStartOrPrecededBySpace = lastAtIdx === 0 || val[lastAtIdx - 1] === " ";
    const hasNoSpaceAfterAt = !/\s/.test(textAfterAt);

    if (isAtStartOrPrecededBySpace && hasNoSpaceAfterAt) {
      setShowMentionPopup(true);
      setMentionQuery(textAfterAt);
      setMentionStartIndex(lastAtIdx);
    } else {
      setShowMentionPopup(false);
    }
  };

  const selectMention = (selectedUser: User) => {
    const input = textInputRef.current;
    if (!input) return;

    const textBeforeMention = text.slice(0, mentionStartIndex);
    const textAfterCursor = text.slice(input.selectionEnd ?? text.length);

    const mentionText = `@${selectedUser.name} `;
    const newText = `${textBeforeMention}${mentionText}${textAfterCursor}`;

    setText(newText);
    setShowMentionPopup(false);

    setMentionedUsers((prev) => {
      if (prev.some((u) => u.id === selectedUser.id)) return prev;
      return [...prev, selectedUser];
    });

    const newCursorPos = mentionStartIndex + mentionText.length;
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  const getActiveMentions = (val: string): string[] => {
    const activeIds: string[] = [];
    mentionedUsers.forEach((u) => {
      const mentionPattern = `@${u.name}`;
      if (val.includes(mentionPattern)) {
        activeIds.push(u.id);
      }
    });
    return activeIds;
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const inputToolsRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null); // 👈 Ref cho drop zone
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const EMOJIS = ["😀", "😄", "😁", "😂", "😊", "😍", "😘", "👍", "👏", "🔥", "❤️", "🎉"];

  // Emit typing event - chỉ emit khi state thay đổi (not typing → typing hoặc typing → not typing)
  const emitTypingEvent = (currentText: string) => {
    if (!socket || !conversationId) return;

    const isCurrentlyTyping = currentText.trim().length > 0;

    // Nếu state không thay đổi, không emit
    if (isCurrentlyTyping === isTypingRef.current) {
      // Clear timeout nếu vẫn typing
      if (isCurrentlyTyping && typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set mới timeout để check stopped typing
      if (isCurrentlyTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          isTypingRef.current = false;
          socket.emit("userStoppedTyping", { conversationId });
        }, 3000);
      }

      return;
    }

    // State thay đổi
    if (isCurrentlyTyping) {
      // Chuyển từ not-typing sang typing
      isTypingRef.current = true;
      socket.emit("userTyping", { conversationId });

      // Clear timeout cũ
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout mới để auto stop typing sau 3s inactivity
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        socket.emit("userStoppedTyping", { conversationId });
      }, 3000);
    } else {
      // Chuyển từ typing sang not-typing
      isTypingRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit("userStoppedTyping", { conversationId });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current && socket && conversationId) {
        socket.emit("userStoppedTyping", { conversationId });
      }
    };
  }, [socket, conversationId]);

  const handleSend = async () => {
    if (text.trim() || attachments.length > 0) {
      try {
        // Emit stopped typing before sending
        emitTypingEvent("");
        
        const activeMentionIds = getActiveMentions(text);

        onSendMessage(
          text.trim(),
          attachments.length > 0 ? attachments : undefined,
          replyingTo?.id,
          activeMentionIds.length > 0 ? activeMentionIds : undefined,
        );
        setText("");
        setAttachments([]);
        setUploadError(null);
        setMentionedUsers([]);
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Failed to send message",
        );
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentionPopup && filteredParticipants.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredParticipants.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredParticipants.length) % filteredParticipants.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        selectMention(filteredParticipants[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionPopup(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedAttachments: Attachment[] = [];

      for (const file of files) {
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;
    await uploadFiles(Array.from(files));
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

    await uploadFiles(Array.from(files));
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const filesToUpload: File[] = [];
    for (const item of Array.from(items) as DataTransferItem[]) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const ext = file.type.split("/")[1] || "png";
          const pastedFile = new File(
            [file],
            `pasted_image_${Date.now()}.${ext}`,
            { type: file.type }
          );
          filesToUpload.push(pastedFile);
        }
      }
    }

    if (filesToUpload.length > 0) {
      await uploadFiles(filesToUpload);
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

  if (isReadOnly) {
    return (
      <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 font-medium select-none">
        <Lock size={16} className="text-slate-400" />
        <span>Chỉ Trưởng nhóm và Phó nhóm mới có quyền gửi tin nhắn trong nhóm này.</span>
      </div>
    );
  }

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
          <AlertCircle size={16} className="shrink-0" />
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
        <div className="flex flex-wrap gap-3 px-2">
          {attachments.map((attachment, index) => {
            const isImage = attachment.fileType?.startsWith("image/");
            if (isImage) {
              return (
                <div
                  key={index}
                  className="relative group h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-all hover:shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachment.url}
                    alt={attachment.fileName}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-1 -right-1 rounded-full bg-rose-500 p-1 text-white shadow transition-all hover:bg-rose-600 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 duration-150"
                  >
                    <X size={12} />
                  </button>
                  {/* Fallback delete button for touch devices */}
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="absolute top-1 right-1 rounded-full bg-slate-900/60 p-0.5 text-white md:hidden"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            }
            return (
              <div
                key={index}
                className="flex items-center gap-1.5 rounded-full bg-slate-100 pl-3 pr-2 py-1 text-sm border border-slate-200 hover:bg-slate-200 transition-colors"
              >
                <span className="max-w-xs truncate text-slate-700 font-medium">
                  📎 {attachment.fileName}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="rounded-full p-0.5 hover:bg-slate-300 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
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
          {showMentionPopup && (
            <div className="absolute bottom-full left-0 z-30 mb-3 max-h-60 w-72 overflow-y-auto rounded-2xl border border-slate-100 bg-white py-1 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
              {filteredParticipants.length === 0 ? (
                <div className="px-4 py-3 text-center text-xs text-slate-400 font-medium">
                  Không tìm thấy thành viên nào
                </div>
              ) : (
                filteredParticipants.map((participant, index) => (
                  <button
                    key={participant.id}
                    type="button"
                    onClick={() => selectMention(participant)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-all duration-100 border-l-4 ${
                      index === selectedIndex
                        ? "bg-blue-50/70 border-blue-600 text-blue-900"
                        : "text-slate-700 hover:bg-slate-50 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {participant.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={participant.avatarUrl}
                          alt={participant.name}
                          className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 ring-1 ring-slate-100">
                          {participant.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate leading-snug">{participant.name}</p>
                        {participant.email && (
                          <p className="text-[11px] text-slate-400 truncate leading-none mt-0.5">{participant.email}</p>
                        )}
                      </div>
                    </div>
                    {participant.role && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                        participant.role === 'teacher' 
                          ? 'bg-amber-100 text-amber-800' 
                          : participant.role === 'admin'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {participant.role === 'teacher' ? 'GV' : participant.role === 'admin' ? 'Admin' : 'HS'}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
          <input
            ref={textInputRef}
            type="text"
            value={text}
            onChange={(e) => {
              const newText = e.target.value;
              setText(newText);
              emitTypingEvent(newText);
              const cursor = e.target.selectionStart || 0;
              detectMention(newText, cursor);
            }}
            onSelect={(e) => {
              const cursor = e.currentTarget.selectionStart || 0;
              detectMention(text, cursor);
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
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
