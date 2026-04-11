"use client";

import React, { useState } from "react";
import { Message, User } from "../types";
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
        className={`flex w-full mb-4 ${isOwnMessage ? "justify-end" : "justify-start"}`}
      >
        {!isOwnMessage && sender && (
          <Image
            src={sender.avatarUrl}
            alt={sender.name}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full mt-auto mr-2"
          />
        )}
        <div
          className={`flex flex-col max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"}`}
        >
          {!isOwnMessage && sender && (
            <span className="text-xs text-gray-500 mb-1 ml-1">
              {sender.name}
            </span>
          )}
          <div
            className={`px-4 py-2 rounded-2xl italic text-gray-400 ${
              isOwnMessage
                ? "bg-gray-200 dark:bg-gray-700 rounded-br-sm"
                : "bg-gray-100 dark:bg-gray-800 rounded-bl-sm"
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
      className={`flex w-full mb-4 group ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      {!isOwnMessage && sender && (
        <Image
          src={sender.avatarUrl}
          alt={sender.name}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full mt-auto mr-2"
        />
      )}

      <div
        className={`flex flex-col max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"}`}
      >
        {!isOwnMessage && sender && (
          <span className="text-xs text-gray-500 mb-1 ml-1">{sender.name}</span>
        )}

        {/* Reply reference */}
        {message.replyTo && (
          <div className="mb-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs border-l-2 border-blue-500 max-w-full">
            <p className="text-gray-500 dark:text-gray-400 mb-1">Trả lời</p>
            <p className="text-gray-700 dark:text-gray-300 truncate">
              {message.replyTo.isRevoked
                ? "Tin nhắn đã bị thu hồi"
                : message.replyTo.content.substring(0, 100)}
            </p>
          </div>
        )}

        {/* Message content */}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwnMessage
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm"
          }`}
        >
          <p className="text-sm">{message.content}</p>

          {/* Attachments */}
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
                        className="max-w-[200px] max-h-[200px] rounded-lg"
                      />
                    </a>
                  ) : (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:underline"
                    >
                      <span>{getFileIcon(attachment.fileName)}</span>
                      <span className="truncate">{attachment.fileName}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Time and reactions */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-gray-400 mx-1">
            {formatTime(message.createdAt)}
          </span>

          {/* Reactions display */}
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
                    className="bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <span>{reaction.emoji}</span>
                    {count > 1 && (
                      <span className="text-gray-600 dark:text-gray-400">
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

      {/* Action menu */}
      <div className="relative ml-2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-all"
        >
          <MoreVertical size={16} className="text-gray-400" />
        </button>

        {/* Menu dropdown */}
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
            {/* Emoji picker button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 rounded-t"
            >
              <Smile size={16} />
              Phản ứng
            </button>

            {/* Emoji options */}
            {showEmojiPicker && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-2 py-2 flex gap-1">
                {EMOJI_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-lg hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Reply button */}
            {!isOwnMessage && (
              <button
                onClick={() => {
                  onReply?.(message);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
              >
                <Reply size={16} />
                Trả lời
              </button>
            )}

            {/* Revoke button */}
            {isOwnMessage && (
              <button
                onClick={() => {
                  onRevoke?.(message.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2 rounded-b"
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
