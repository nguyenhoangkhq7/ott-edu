"use client";

import { useEffect, useMemo, useState } from "react";
import { chatApiClient } from "@/services/api";
import { useAuth } from "@/shared/providers/AuthProvider";
import { ChatLayout } from "./components/ChatLayout";
import { fetchCurrentChatUser } from "./chatApi";
import type { User } from "./types";

export default function ChatPage() {
  const { user, isInitializing, isAuthenticated } = useAuth();
  const [chatUser, setChatUser] = useState<User | null>(null);
  const [isResolvingUser, setIsResolvingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const identity = useMemo(() => {
    if (!user?.email) return null;
    return {
      email: user.email,
    };
  }, [user]);

  useEffect(() => {
    if (!identity) {
      setChatUser(null);
      return;
    }

    chatApiClient.defaults.headers.common["x-user-email"] = identity.email;
    delete chatApiClient.defaults.headers.common["x-user-name"];
    delete chatApiClient.defaults.headers.common["x-user-avatar"];

    const resolveChatUser = async () => {
      setIsResolvingUser(true);
      setError(null);
      try {
        const me = await fetchCurrentChatUser(identity);
        setChatUser(me);
      } catch (resolveError) {
        setError(
          resolveError instanceof Error
            ? resolveError.message
            : "Không thể đồng bộ người dùng chat.",
        );
      } finally {
        setIsResolvingUser(false);
      }
    };

    void resolveChatUser();
  }, [identity]);

  if (isInitializing || isResolvingUser) {
    return <div className="h-[calc(100vh-180px)] animate-pulse rounded-xl border border-slate-200 bg-white" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <h2 className="mb-2 text-2xl font-semibold text-slate-900">Chat</h2>
        <p className="max-w-md text-slate-500">Bạn cần đăng nhập để sử dụng tính năng chat.</p>
      </div>
    );
  }

  if (error || !chatUser) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || "Không thể khởi tạo phiên chat."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Chat</h1>
        <p className="text-sm text-slate-500">Trao đổi trực tiếp với thành viên trong lớp và nhóm.</p>
      </div>

      <ChatLayout currentUserId={chatUser.id} />
    </div>
  );
}
