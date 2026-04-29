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
    <div className="flex h-full w-80 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <h1 className="text-xl font-semibold text-slate-900">
          Tin nhắn
        </h1>
        {currentUser && (
          <p className="mt-1 truncate text-xs text-slate-500">
            {currentUser.name}
          </p>
        )}
      </div>

      <SidebarTabs currentMode={currentMode} onModeChange={onModeChange} />

      {currentMode === "private" && (
        <div className="px-4 pb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Tìm theo tên, MSSV, email..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
          />
        </div>
      )}

      <div className="mt-2 flex-1 overflow-y-auto pb-3">
        {isLoading && (
          <div className="mt-10 flex items-center justify-center gap-2 text-slate-400">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm">Đang tải...</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="mx-3 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        {!isLoading && !error && filteredConversations.length === 0 && (
          <div className="mt-10 px-4 text-center text-sm text-slate-500">
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
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-100"
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
