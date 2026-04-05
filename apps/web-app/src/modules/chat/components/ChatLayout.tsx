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

  const socketRef = useRef<Socket | null>(null);

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

  // ── Khởi tạo Socket.IO ───────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;

    const socket = io(CHAT_SERVICE_URL, {
      auth: { userId: currentUserId },
      query: { userId: currentUserId },
    });

    socketRef.current = socket;

    // Nhận tin nhắn mới từ server real-time
    const handleNewMessage = (rawMessage: any) => {
      const incoming = mapApiMessageToMessage(rawMessage);

      // Append tin nhắn vào cửa sổ chat nếu đang mở đúng conversation đó
      setActiveConversationId((activeId) => {
        if (activeId && incoming.conversationId === activeId) {
          setMessages((prev) => {
            // Deduplication: bỏ qua nếu message ID đã tồn tại
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
        return activeId;
      });

      // Cập nhật lastMessage ở sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c.id === incoming.conversationId
            ? { ...c, lastMessage: incoming, unreadCount: c.unreadCount + 1 }
            : c,
        ),
      );
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      // Gỡ đúng listener để tránh duplicate khi React StrictMode double-mount
      socket.off("newMessage", handleNewMessage);
      socket.disconnect();
    };
  }, [currentUserId]);


  // ── Fetch Conversations ──────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoadingConversations(true);
    setError(null);
    try {
      const data = await fetchConversations(currentUserId);
      setConversations(data);
    } catch (err: any) {
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
  const handleSendMessage = async (text: string) => {
    if (!activeConversationId || !currentUserId || isSending) return;

    const activeConversation = conversations.find(
      (c) => c.id === activeConversationId,
    );
    if (!activeConversation) return;

    // Tìm receiverId (người nhận = participant khác trong cuộc trò chuyện)
    const receiver = activeConversation.participants.find(
      (p) => p.id !== currentUserId,
    );
    if (!receiver) return;

    // Optimistic UI: hiển thị ngay không chờ server
    const optimisticMessage: Message = {
      id: `optimistic_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUserId,
      content: text,
      createdAt: new Date().toISOString(),
      status: "sent",
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    setIsSending(true);
    try {
      // Gọi API thực POST /api/messages
      let savedMessage: Message;
      if (activeConversation.type === "class") {
        savedMessage = await sendMessage(text, undefined, activeConversation.id);
      } else {
        savedMessage = await sendMessage(text, receiver.id, undefined);
      }

      // Thay optimistic message bằng message thực từ DB
      setMessages((prev) => {
        // Kiểm tra xem socket đã chạy vào và nhét tin nhắn thực này vào mảng chưa
        const alreadyHasSocketMess = prev.some((m) => m.id === savedMessage.id);
        
        if (alreadyHasSocketMess) {
          // Xoá cái optimistic giả đi vì tin nhắn thực đã có
          return prev.filter((m) => m.id !== optimisticMessage.id);
        } else {
          // Socket chưa tới (hoặc ta là người gửi), nên lấy `savedMessage` thay thế cho optimistic giả
          return prev.map((m) => (m.id === optimisticMessage.id ? savedMessage : m));
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
    } finally {
      setIsSending(false);
    }
  };

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <div className="flex h-screen w-full bg-white dark:bg-gray-950 font-sans shadow-2xl overflow-hidden rounded-xl">
      <Sidebar
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        conversations={conversations}
        currentUser={currentUser}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
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
      />
    </div>
  );
};
