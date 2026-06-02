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
      code: user.code || undefined,
    };
  }, [user]);

  useEffect(() => {
    if (!identity) {
      queueMicrotask(() => {
        setChatUser(null);
      });
      return;
    }

    chatApiClient.defaults.headers.common["x-user-email"] = identity.email;
    chatApiClient.defaults.headers.common["x-user-code"] = identity.code || "";
    
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email?.split("@")[0] || "User";
    chatApiClient.defaults.headers.common["x-user-name"] = encodeURIComponent(fullName);
    if (user?.avatarUrl) {
      chatApiClient.defaults.headers.common["x-user-avatar"] = user.avatarUrl;
    } else {
      delete chatApiClient.defaults.headers.common["x-user-avatar"];
    }

    const resolveChatUser = async () => {
      queueMicrotask(() => {
        setIsResolvingUser(true);
        setError(null);
      });
      try {
        const me = await fetchCurrentChatUser(identity);
        queueMicrotask(() => {
          setChatUser(me);
        });
      } catch (resolveError) {
        queueMicrotask(() => {
          setError(
            resolveError instanceof Error
              ? resolveError.message
              : "Không thể đồng bộ người dùng chat.",
          );
        });
      } finally {
        queueMicrotask(() => {
          setIsResolvingUser(false);
        });
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
    <ChatLayout currentUserId={chatUser.id} />
  );
}
