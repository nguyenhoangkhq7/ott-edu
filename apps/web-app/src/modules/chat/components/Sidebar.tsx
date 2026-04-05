import React from "react";
import { Conversation, ChatMode, User } from "../types";
import { SidebarTabs } from "./SidebarTabs";
import { ConversationItem } from "./ConversationItem";
import { RefreshCw } from "lucide-react";

interface SidebarProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  conversations: Conversation[];
  currentUser: User | null;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onModeChange,
  conversations,
  currentUser,
  activeConversationId,
  onSelectConversation,
  isLoading = false,
  error = null,
}) => {
  const filteredConversations = conversations.filter(
    (c) => c.type === currentMode
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
      </div>
    </div>
  );
};
