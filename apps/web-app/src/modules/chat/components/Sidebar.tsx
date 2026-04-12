import React from "react";
import { Conversation, ChatMode, User } from "../types";
import { SidebarTabs } from "./SidebarTabs";
import { ConversationItem } from "./ConversationItem";
import { RefreshCw } from "lucide-react";
import Image from "next/image";

interface SidebarProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  conversations: Conversation[];
  suggestedUsers: User[];
  currentUser: User | null;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onStartPrivateChat: (user: User) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onModeChange,
  searchQuery,
  onSearchQueryChange,
  conversations,
  suggestedUsers,
  currentUser,
  activeConversationId,
  onSelectConversation,
  onStartPrivateChat,
  isLoading = false,
  error = null,
}) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredConversations = conversations.filter(
    (c) => {
      if (c.type !== currentMode) return false;
      if (!normalizedQuery) return true;

      const otherParticipant =
        c.type === "private"
          ? c.participants.find((p) => p.id !== currentUser?.id)
          : null;
      const searchable = [
        c.name,
        c.lastMessage?.content,
        otherParticipant?.name,
        otherParticipant?.email,
        otherParticipant?.code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    },
  );

  return (
    <div className="w-80 h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Tin nhắn
        </h1>
        {currentUser && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {currentUser.name}
          </p>
        )}
      </div>

      {/* Tabs */}
      <SidebarTabs currentMode={currentMode} onModeChange={onModeChange} />

      {currentMode === "private" && (
        <div className="px-4 pt-1 pb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Tìm theo tên, MSSV, email..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400"
          />
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto mt-2">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 mt-10 text-gray-400">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm">Đang tải...</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="mx-3 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {!isLoading && !error && filteredConversations.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-10 px-4">
            Chưa có đoạn chat nào.
          </div>
        )}

        {!isLoading &&
          !error &&
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              currentUser={
                currentUser || {
                  id: "",
                  name: "",
                  avatarUrl: "",
                  isOnline: false,
                }
              }
              isActive={conv.id === activeConversationId}
              onClick={() => onSelectConversation(conv.id)}
            />
          ))}

        {!isLoading &&
          !error &&
          currentMode === "private" &&
          suggestedUsers.length > 0 && (
            <div className="mt-4 px-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Gợi ý từ lớp/nhóm của bạn
              </p>
              <div className="space-y-1">
                {suggestedUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => onStartPrivateChat(user)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-100"
                  >
                    <Image
                      src={user.avatarUrl}
                      alt={user.name}
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {user.code || user.email || "Bắt đầu nhắn tin"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        {!isLoading &&
          !error &&
          currentMode === "private" &&
          normalizedQuery &&
          suggestedUsers.length === 0 && (
            <div className="px-4 py-2 text-xs text-slate-400">
              Không tìm thấy thành viên lớp/nhóm phù hợp.
            </div>
          )}
      </div>
    </div>
  );
};
