"use client";
import React, { useRef, useEffect, useState } from "react";
import { Conversation, Message, User, Attachment, Reaction } from "../types";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { Phone, Video, Info, RefreshCw } from "lucide-react";
import Image from "next/image";
import { Socket } from "socket.io-client";
import ConversationInfoSidebar from "@/shared/components/ConversationInfoSidebar";

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUser: User | null;
  onSendMessage: (
    text: string,
    attachments?: Attachment[],
    replyToId?: string,
  ) => Promise<void>;
  isLoadingMessages?: boolean;
  isSending?: boolean;
  socket?: Socket | null;
  onForwardMessage?: (message: Message) => void;
  onOpenProfile?: (user: User) => void;
  onOpenGroupManage?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  isLoadingMessages = false,
  isSending = false,
  socket,
  onForwardMessage,
  onOpenProfile,
  onOpenGroupManage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(false);

  // Update local messages when messages prop changes
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !conversation) return;

    const handleMessageReacted = (data: {
      messageId: string;
      reactions: Reaction[];
    }) => {
      setLocalMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, reactions: data.reactions }
            : msg,
        ),
      );
    };

    const handleMessageRevoked = (data: {
      messageId: string;
      revokeType?: "all" | "self";
      isRevoked?: boolean;
    }) => {
      setLocalMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== data.messageId) return msg;

          if (data.revokeType === "self") {
            return msg; // Đã xử lý optimistic ở handleRevokeForMe
          }

          // revokeForAll
          return { ...msg, isRevoked: true };
        }),
      );
    };

    socket.on("messageReacted", handleMessageReacted);
    socket.on("messageRevoked", handleMessageRevoked);

    return () => {
      socket.off("messageReacted", handleMessageReacted);
      socket.off("messageRevoked", handleMessageRevoked);
    };
  }, [socket, conversation]);

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-slate-50">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <svg
            className="h-8 w-8 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <p className="text-sm text-slate-500">
          Chọn một đoạn chat để bắt đầu trò chuyện
        </p>
      </div>
    );
  }

  // Header display logic
  let displayName = conversation.name;
  let displayAvatar = conversation.avatarUrl;
  let subStatus =
    conversation.type === "class"
      ? `${conversation.participants.length} thành viên`
      : "Đang hoạt động";

  if (conversation.type === "private" && currentUser) {
    const otherParticipant = conversation.participants.find(
      (p) => p.id !== currentUser.id,
    );
    if (otherParticipant) {
      displayName = otherParticipant.name;
      displayAvatar = otherParticipant.avatarUrl;
      subStatus = otherParticipant.isOnline ? "Đang hoạt động" : "Ngoại tuyến";
    }
  }

  const getSender = (senderId: string) =>
    conversation.participants.find((p) => p.id === senderId);

  const handleSendMessage = async (
    text: string,
    attachments?: Attachment[],
    replyToId?: string,
  ) => {
    try {
      await onSendMessage(text, attachments, replyToId);
      setReplyingTo(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (socket && conversation) {
      socket.emit("reactMessage", {
        messageId,
        conversationId: conversation.id,
        emoji,
      });
    }
  };

  const handleRevokeForAll = (messageId: string) => {
    if (!socket || !conversation) return;

    // Optimistic update
    setLocalMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isRevoked: true } : m)),
    );

    socket.emit("revokeForAll", { messageId, conversationId: conversation.id });

    // Rollback if error
    socket.once("revokeError", (err: { messageId: string; error: string }) => {
      if (err.messageId === messageId) {
        console.warn("[Revoke]", err.error);
        setLocalMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, isRevoked: false } : m,
          ),
        );
      }
    });
  };

  const handleRevokeForMe = (messageId: string) => {
    if (!socket || !conversation || !currentUser) return;

    // Optimistic update
    setLocalMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, revokedFor: [...(m.revokedFor || []), currentUser.id] }
          : m,
      ),
    );

    socket.emit("revokeForMe", { messageId, conversationId: conversation.id });
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-white">
      {/* ==================== HEADER ==================== */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <button
          type="button"
          onClick={() => {
            if (conversation.type !== "private" || !currentUser) return;
            const headerUser = conversation.participants.find(
              (p) => p.id !== currentUser.id,
            );
            if (headerUser) onOpenProfile?.(headerUser);
          }}
          className={`flex items-center gap-3 text-left ${
            conversation.type === "private" ? "cursor-pointer" : "cursor-default"
          }`}
        >
          <Image
            src={
              displayAvatar || `https://i.pravatar.cc/150?u=${conversation.id}`
            }
            alt="Avatar"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
          />

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {displayName || "Unknown"}
            </h2>
            <p className="text-xs text-slate-500">{subStatus}</p>
          </div>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 text-slate-400">
          <button
            type="button"
            className="rounded-full p-2 transition-colors hover:bg-slate-100 hover:text-blue-500"
          >
            <Phone size={20} />
          </button>
          <button
            type="button"
            className="rounded-full p-2 transition-colors hover:bg-slate-100 hover:text-blue-500"
          >
            <Video size={20} />
          </button>

          {/* Info Button - Mở Sidebar */}
          <button
            type="button"
            onClick={() => setIsInfoSidebarOpen(!isInfoSidebarOpen)}
            className={`rounded-full p-2 transition-colors ${
              isInfoSidebarOpen
                ? "bg-blue-100 text-blue-500"
                : "hover:bg-slate-100 hover:text-blue-500"
            }`}
            title="Thông tin hội thoại"
          >
            <Info size={20} />
          </button>

          {/* Group Manage Button (chỉ hiện với class/group) */}
          {conversation.type === "class" && onOpenGroupManage && (
            <button
              type="button"
              onClick={onOpenGroupManage}
              className="rounded-full p-2 transition-colors hover:bg-slate-100 hover:text-blue-500"
              title="Quản lý nhóm"
            >
              <Info size={20} /> {/* Bạn có thể thay bằng icon khác nếu muốn */}
            </button>
          )}
        </div>
      </div>

      {/* ==================== MESSAGES AREA ==================== */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-4">
        {isLoadingMessages ? (
          <div className="flex h-full items-center justify-center gap-2 text-slate-400">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm">Đang tải tin nhắn...</span>
          </div>
        ) : localMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Hãy là người đầu tiên gửi tin nhắn! 👋
          </div>
        ) : (
          localMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwnMessage={msg.senderId === currentUser?.id}
              currentUserId={currentUser?.id}
              sender={getSender(msg.senderId)}
              onReply={setReplyingTo}
              onReact={handleReact}
              onRevokeForAll={handleRevokeForAll}
              onRevokeForMe={handleRevokeForMe}
              onForward={onForwardMessage}
              onOpenProfile={onOpenProfile}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ==================== MESSAGE INPUT ==================== */}
      <MessageInput
        onSendMessage={handleSendMessage}
        isSending={isSending}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />

      {/* ==================== INFO SIDEBAR ==================== */}
      {isInfoSidebarOpen && (
        <ConversationInfoSidebar
          conversationId={conversation.id}
          isOpen={isInfoSidebarOpen}
          onClose={() => setIsInfoSidebarOpen(false)}
        />
      )}
    </div>
  );
};