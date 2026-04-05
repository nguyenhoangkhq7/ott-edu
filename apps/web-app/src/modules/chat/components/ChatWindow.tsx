import React, { useRef, useEffect } from "react";
import { Conversation, Message, User } from "../types";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { Phone, Video, Info, RefreshCw } from "lucide-react";

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUser: User | null;
  onSendMessage: (text: string) => void;
  isLoadingMessages?: boolean;
  isSending?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  isLoadingMessages = false,
  isSending = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 gap-3">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-blue-500"
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
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Chọn một đoạn chat để bắt đầu trò chuyện
        </p>
      </div>
    );
  }

  // Header display logic
  let displayName = conversation.name;
  let displayAvatar = conversation.avatarUrl;
  let subStatus =
    conversation.type === "group"
      ? `${conversation.participants.length} thành viên`
      : "Đang hoạt động";

  if (conversation.type === "direct" && currentUser) {
    const otherParticipant = conversation.participants.find(
      (p) => p.id !== currentUser.id
    );
    if (otherParticipant) {
      displayName = otherParticipant.name;
      displayAvatar = otherParticipant.avatarUrl;
      subStatus = otherParticipant.isOnline ? "Đang hoạt động" : "Ngoại tuyến";
    }
  }

  const getSender = (senderId: string) =>
    conversation.participants.find((p) => p.id === senderId);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={
              displayAvatar ||
              `https://i.pravatar.cc/150?u=${conversation.id}`
            }
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {displayName || "Unknown"}
            </h2>
            <p className="text-xs text-green-500">{subStatus}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-gray-400">
          <button className="hover:text-blue-500 transition-colors">
            <Phone size={20} />
          </button>
          <button className="hover:text-blue-500 transition-colors">
            <Video size={20} />
          </button>
          <button className="hover:text-blue-500 transition-colors">
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950">
        {isLoadingMessages ? (
          <div className="h-full flex items-center justify-center gap-2 text-gray-400">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm">Đang tải tin nhắn...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Hãy là người đầu tiên gửi tin nhắn! 👋
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwnMessage={msg.senderId === currentUser?.id}
              sender={getSender(msg.senderId)}
            />
          ))
        )}
        {/* Ghost div để auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSendMessage={onSendMessage} isSending={isSending} />
    </div>
  );
};
