"use client";

import React, { useState } from "react";
import { Message, User } from "../types";
import { LinkPreviewCard } from "./LinkPreviewCard";
import Image from "next/image";
import { MoreVertical, Reply, Trash2, Smile } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  sender?: User;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRevoke?: (messageId: string) => void;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  sender,
  onReply,
  onReact,
  onRevoke,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const formatTime = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isImage = (fileType: string) => fileType.startsWith("image/");

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".pdf")) return "📄";
    if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) return "📃";
    if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) return "📊";
    if (fileName.endsWith(".zip")) return "🗜️";
    return "📎";
  };

  const handleEmojiSelect = (emoji: string) => {
    onReact?.(message.id, emoji);
    setShowEmojiPicker(false);
  };

  if (message.isRevoked) {
    return (
      <div
        className={`mb-4 flex w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}
      >
        {!isOwnMessage && sender && (
          <Image
            src={sender.avatarUrl}
            alt={sender.name}
            width={32}
            height={32}
            className="mr-2 mt-auto h-8 w-8 rounded-full ring-1 ring-slate-200"
          />
        )}
        <div
          className={`flex max-w-[70%] flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
        >
          {!isOwnMessage && sender && (
            <span className="mb-1 ml-1 text-xs text-slate-500">
              {sender.name}
            </span>
          )}
          <div
            className={`rounded-2xl px-4 py-2 italic text-slate-400 ${
              isOwnMessage
                ? "rounded-br-sm bg-slate-200"
                : "rounded-bl-sm bg-slate-100"
            }`}
          >
            <p className="text-sm">Tin nhắn đã bị thu hồi</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group mb-4 flex w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      {!isOwnMessage && sender && (
        <Image
          src={sender.avatarUrl}
          alt={sender.name}
          width={32}
          height={32}
          className="mr-2 mt-auto h-8 w-8 rounded-full ring-1 ring-slate-200"
        />
      )}

      <div
        className={`flex max-w-[70%] flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
      >
        {!isOwnMessage && sender && (
          <span className="mb-1 ml-1 text-xs text-slate-500">{sender.name}</span>
        )}

        {message.replyTo && (
          <div className="mb-2 max-w-full rounded-xl border-l-2 border-blue-500 bg-slate-100 px-3 py-2 text-xs">
            <p className="mb-1 text-slate-500">Trả lời</p>
            <p className="truncate text-slate-700">
              {message.replyTo.isRevoked
                ? "Tin nhắn đã bị thu hồi"
                : (message.replyTo.content || "(Tin nhắn trống)").substring(
                    0,
                    100,
                  )}
            </p>
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwnMessage
              ? "rounded-br-sm bg-blue-600 text-white"
              : "rounded-bl-sm bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
          }`}
        >
          <p className="text-sm">{message.content}</p>

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((attachment, idx) => (
                <div key={idx}>
                  {isImage(attachment.fileType) ? (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Image
                        src={attachment.url}
                        alt={attachment.fileName}
                        width={200}
                        height={200}
                        className="max-h-[200px] max-w-[200px] rounded-lg object-cover"
                      />
                    </a>
                  ) : (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1 text-sm text-slate-700 hover:underline"
                    >
                      <span>{getFileIcon(attachment.fileName)}</span>
                      <span className="truncate">{attachment.fileName}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Render Link Preview Card nếu có linkPreview data */}
          {message.linkPreview && (
            <LinkPreviewCard
              linkPreview={message.linkPreview}
              isOwnMessage={isOwnMessage}
            />
          )}
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className="mx-1 text-[10px] text-slate-400">
            {formatTime(message.createdAt)}
          </span>

          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {Array.from(
                new Map(message.reactions.map((r) => [r.emoji, r])).values(),
              ).map((reaction) => {
                const count = message.reactions.filter(
                  (r) => r.emoji === reaction.emoji,
                ).length;
                return (
                  <div
                    key={reaction.emoji}
                    className="flex cursor-pointer items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs transition-colors hover:bg-slate-300"
                  >
                    <span>{reaction.emoji}</span>
                    {count > 1 && (
                      <span className="text-slate-600">
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="relative ml-2">
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className="rounded-full p-1 opacity-0 transition-all hover:bg-slate-200 group-hover:opacity-100"
        >
          <MoreVertical size={16} className="text-slate-400" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full z-20 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex w-full items-center gap-2 rounded-t-xl px-3 py-2 text-left text-sm hover:bg-slate-100"
            >
              <Smile size={16} />
              Phản ứng
            </button>

            {showEmojiPicker && (
              <div className="flex gap-1 border-t border-slate-200 px-2 py-2">
                {EMOJI_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="rounded-lg p-1 text-lg hover:bg-slate-100"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {!isOwnMessage && (
              <button
                type="button"
                onClick={() => {
                  onReply?.(message);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100"
              >
                <Reply size={16} />
                Trả lời
              </button>
            )}

            {isOwnMessage && (
              <button
                type="button"
                onClick={() => {
                  onRevoke?.(message.id);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-b-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
                Thu hồi
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
