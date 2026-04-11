"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { ChatMode, Conversation, Message, User } from "../types";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  mapApiMessageToMessage,
} from "../chatApi";

const CHAT_SERVICE_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:3001";

interface ChatLayoutProps {
  currentUserId: string;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ currentUserId }) => {
  const [currentMode, setCurrentMode] = useState<ChatMode>("private");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Tạo User hiện tại từ danh sách conversations ─────────────────────────
  const currentUser: User | null =
    conversations.length > 0
      ? conversations[0].participants.find((p) => p.id === currentUserId) || {
          id: currentUserId,
          name: "Bạn",
          avatarUrl: `https://i.pravatar.cc/150?u=${currentUserId}`,
          isOnline: true,
        }
      : {
          id: currentUserId,
          name: "Bạn",
          avatarUrl: `https://i.pravatar.cc/150?u=${currentUserId}`,
          isOnline: true,
        };

  const socketRef = useRef<Socket | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);

  // Giữ ref luôn cập nhật để xài trong socket handler (tránh dependency bắt reconnect socket)
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // ── Khởi tạo Socket.IO ───────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;

    const socket = io(CHAT_SERVICE_URL, {
      auth: { userId: currentUserId },
      query: { userId: currentUserId },
    });

    socketRef.current = socket;

    // Nhận tin nhắn mới từ server real-time
    const handleNewMessage = (rawMessage: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const incoming = mapApiMessageToMessage(rawMessage as any);
      const isActive =
        activeConversationIdRef.current === incoming.conversationId;
      const isSelf = incoming.senderId === currentUserId;

      // Append tin nhắn vào cửa sổ chat nếu đang mở đúng conversation đó
      if (isActive) {
        setMessages((prev) => {
          // Deduplication: bỏ qua nếu message ID đã tồn tại
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
      }

      // Cập nhật lastMessage ở sidebar
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === incoming.conversationId) {
            // Không tăng biến đếm nếu đang mở khung chat đó hoặc tự mình gửi
            const shouldIncrement = !isActive && !isSelf;
            return {
              ...c,
              lastMessage: incoming,
              unreadCount: shouldIncrement ? c.unreadCount + 1 : c.unreadCount,
            };
          }
          return c;
        }),
      );
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      // Gỡ đúng listener để tránh duplicate khi React StrictMode double-mount
      socket.off("newMessage", handleNewMessage);
      socket.disconnect();
    };
  }, [currentUserId]);

  // Handle khi click đổi cuộc trò chuyện: Reset số đếm unread về 0
  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    );
  }, []);

  // ── Fetch Conversations ──────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoadingConversations(true);
    setError(null);
    try {
      const data = await fetchConversations(currentUserId);
      setConversations(data);
    } catch (err) {
      console.error("[ChatLayout] fetch conversations error:", err);
      setError(
        "Không thể tải danh sách cuộc trò chuyện. Kiểm tra lại chat-service.",
      );
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Fetch Messages khi đổi cuộc thoại ───────────────────────────────────
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const load = async () => {
      setIsLoadingMessages(true);
      try {
        const data = await fetchMessages(activeConversationId);
        setMessages(data);
      } catch (err) {
        console.error("[ChatLayout] fetch messages error:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    load();
  }, [activeConversationId]);

  // ── Gửi tin nhắn ─────────────────────────────────────────────────────────
  const handleSendMessage = async (
    text: string,
    attachments?: Array<{ url: string; fileType: string; fileName: string }>,
    replyToId?: string,
  ) => {
    if (!activeConversationId || !currentUserId || isSending) return;

    const activeConversation = conversations.find(
      (c) => c.id === activeConversationId,
    );
    if (!activeConversation) return;

    // Tìm receiverId (người nhận = participant khác trong cuộc trò chuyện)
    const receiver = activeConversation.participants.find(
      (p) => p.id !== currentUserId,
    );
    if (!receiver && activeConversation.type === "private") return;

    // Optimistic UI: hiển thị ngay không chờ server
    const optimisticMessage: Message = {
      id: `optimistic_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUserId,
      content: text,
      createdAt: new Date().toISOString(),
      status: "sent",
      attachments: attachments || [],
      replyTo: undefined,
      isRevoked: false,
      reactions: [],
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    setIsSending(true);
    try {
      // Gọi API thực POST /api/messages
      let savedMessage: Message;
      if (activeConversation.type === "class") {
        savedMessage = await sendMessage(
          text,
          undefined,
          activeConversation.id,
          attachments,
          replyToId,
        );
      } else {
        savedMessage = await sendMessage(
          text,
          receiver?.id,
          undefined,
          attachments,
          replyToId,
        );
      }

      // Thay optimistic message bằng message thực từ DB
      setMessages((prev) => {
        // Kiểm tra xem socket đã chạy vào và nhét tin nhắn thực này vào mảy chưa
        const alreadyHasSocketMess = prev.some((m) => m.id === savedMessage.id);

        if (alreadyHasSocketMess) {
          // Xoá cái optimistic giả đi vì tin nhắn thực đã có
          return prev.filter((m) => m.id !== optimisticMessage.id);
        } else {
          // Socket chưa tới (hoặc ta là người gửi), nên lấy `savedMessage` thay thế cho optimistic giả
          return prev.map((m) =>
            m.id === optimisticMessage.id ? savedMessage : m,
          );
        }
      });

      // Cập nhật lastMessage của conversation trong danh sách
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, lastMessage: savedMessage }
            : c,
        ),
      );
    } catch (err) {
      console.error("[ChatLayout] send message error:", err);
      // Xoá optimistic nếu thất bại
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setError(err instanceof Error ? err.message : "Không thể gửi tin nhắn");
    } finally {
      setIsSending(false);
    }
  };

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[620px] w-full overflow-hidden rounded-xl border border-slate-200 bg-white font-sans shadow-sm">
      <Sidebar
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        conversations={conversations}
        currentUser={currentUser}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        isLoading={isLoadingConversations}
        error={error}
      />
      <ChatWindow
        conversation={activeConversation}
        messages={messages}
        currentUser={currentUser}
        onSendMessage={handleSendMessage}
        isLoadingMessages={isLoadingMessages}
        isSending={isSending}
        socket={socketRef.current}
      />
    </div>
  );
};
