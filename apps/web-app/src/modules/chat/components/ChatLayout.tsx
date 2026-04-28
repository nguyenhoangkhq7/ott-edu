"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getAccessToken } from "@/services/api/token-store";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { ForwardMessageModal } from "./ForwardMessageModal";
import { ChatUserProfileModal } from "./ChatUserProfileModal";
import { ChatGroupManageModal } from "./ChatGroupManageModal";
import {
  CallHistoryItem,
  ChatMode,
  Conversation,
  Message,
  Reaction,
  User,
} from "../types";
import { useWebRTC } from "../hooks/useWebRTC";
import {
  fetchCallHistory,
  fetchConversations,
  fetchMessages,
  fetchConversationRole,
  dissolveGroup,
  leaveGroup,
  removeGroupMember,
  sendMessage,
  mapApiMessageToMessage,
} from "../chatApi";

function resolveSocketServerUrl(): string | undefined {
  const configuredUrl = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL?.trim();

  const getGatewayOriginFromApiUrl = (): string | undefined => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!apiUrl) {
      return undefined;
    }

    try {
      return new URL(apiUrl).origin;
    } catch {
      return undefined;
    }
  };

  if (!configuredUrl || configuredUrl.startsWith("/")) {
    // If UI is served from Next dev server (:3000), same-origin /socket.io is 404.
    // In that case, use the gateway origin from NEXT_PUBLIC_API_URL.
    if (typeof window !== "undefined" && window.location.port === "3000") {
      const gatewayOrigin = getGatewayOriginFromApiUrl();
      if (gatewayOrigin && gatewayOrigin !== window.location.origin) {
        return gatewayOrigin;
      }
    }

    // Default: same-origin Socket.IO endpoint (proxied by gateway).
    return undefined;
  }

  try {
    const parsed = new URL(configuredUrl);
    return parsed.origin;
  } catch {
    return configuredUrl.replace(/\/+$/, "");
  }
}

interface ChatLayoutProps {
  currentUserId: string;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ currentUserId }) => {
  const [currentMode, setCurrentMode] = useState<ChatMode>("private");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [draftReceiver, setDraftReceiver] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [isLoadingCallHistory, setIsLoadingCallHistory] = useState(false);
  const [callHistoryPage, setCallHistoryPage] = useState(1);
  const [callHistoryTotalPages, setCallHistoryTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [forwardMessageTarget, setForwardMessageTarget] =
    useState<Message | null>(null);
  const [profileTarget, setProfileTarget] = useState<User | null>(null);
  const [showGroupManageModal, setShowGroupManageModal] = useState(false);
  const [groupOwnerTarget, setGroupOwnerTarget] = useState<User | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(
    new Map()
  );

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

  const {
    localStream,
    remoteStream,
    callStatus,
    incomingCall,
    activeCall,
    isMicrophoneEnabled,
    isCameraEnabled,
    callError,
    retryMediaPermission,
    startVideoCall,
    acceptIncomingCall,
    declineIncomingCall,
    endVideoCall,
    toggleMicrophone,
    toggleCamera,
    clearCallError,
  } = useWebRTC({
    socket,
    currentUserId,
  });

  // Giữ ref luôn cập nhật để xài trong socket handler (tránh dependency bắt reconnect socket)
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // ── Khởi tạo Socket.IO ───────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;

    const socketServerUrl = resolveSocketServerUrl();
    const accessToken = getAccessToken();
    const socketAuth: { userId: string; token?: string } = {
      userId: currentUserId,
    };
    const socketQuery: { userId: string; token?: string } = {
      userId: currentUserId,
    };

    if (accessToken) {
      socketAuth.token = accessToken;
      socketQuery.token = accessToken;
    }

    const socketOptions = {
      auth: socketAuth,
      query: socketQuery,
      withCredentials: true,
    };

    const nextSocket = socketServerUrl
      ? io(socketServerUrl, socketOptions)
      : io(socketOptions);

    socketRef.current = nextSocket;
    setSocket(nextSocket);

    const handleUserStatusChanged = (data: {
      userId: string;
      isOnline: boolean;
    }) => {
      setConversations((prev) =>
        prev.map((conv) => ({
          ...conv,
          participants: conv.participants.map((participant) =>
            participant.id === data.userId
              ? { ...participant, isOnline: data.isOnline }
              : participant,
          ),
        })),
      );

      setProfileTarget((prev) =>
        prev && prev.id === data.userId
          ? { ...prev, isOnline: data.isOnline }
          : prev,
      );
    };

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

      // Cập nhật lastMessage ở sidebar và đưa lên đầu danh sách
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === incoming.conversationId);
        if (index === -1) return prev;

        const shouldIncrement = !isActive && !isSelf;
        const updatedConv = {
          ...prev[index],
          lastMessage: incoming,
          unreadCount: shouldIncrement
            ? prev[index].unreadCount + 1
            : prev[index].unreadCount,
        };

        const otherConvs = prev.filter((_, i) => i !== index);
        return [updatedConv, ...otherConvs];
      });
    };

    const handleMessageRevoked = (data: {
      messageId: string;
      revokeType?: string;
      isRevoked?: boolean;
    }) => {
      // Cập nhật tin nhắn trong danh sách chat
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== data.messageId) return msg;

          if (data.revokeType === "self") {
            return {
              ...msg,
              revokedFor: [...(msg.revokedFor || []), "__self__"],
            };
          }

          // revokeForAll
          return { ...msg, isRevoked: true };
        }),
      );

      // Cập nhật lastMessage ở sidebar
      setConversations((prev) =>
        prev.map((c) => {
          if (c.lastMessage?.id === data.messageId) {
            if (data.revokeType === "self") {
              return {
                ...c,
                lastMessage: {
                  ...c.lastMessage,
                  revokedFor: [...(c.lastMessage.revokedFor || []), "__self__"],
                },
              };
            }
            return {
              ...c,
              lastMessage: { ...c.lastMessage, isRevoked: true },
            };
          }
          return c;
        }),
      );
    };

    const handleUserTyping = (data: {
      userId: string;
      conversationId: string;
      timestamp: number;
    }) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        const conversationTypingUsers =
          newMap.get(data.conversationId) || new Set<string>();
        conversationTypingUsers.add(data.userId);
        newMap.set(data.conversationId, conversationTypingUsers);

        // Auto remove after 3 seconds of inactivity
        setTimeout(() => {
          setTypingUsers((current) => {
            const updated = new Map(current);
            const users = updated.get(data.conversationId);
            if (users) {
              users.delete(data.userId);
              if (users.size === 0) {
                updated.delete(data.conversationId);
              } else {
                updated.set(data.conversationId, users);
              }
            }
            return updated;
          });
        }, 3000);

        return newMap;
      });
    };

    const handleUserStoppedTyping = (data: {
      userId: string;
      conversationId: string;
    }) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        const conversationTypingUsers =
          newMap.get(data.conversationId);
        if (conversationTypingUsers) {
          conversationTypingUsers.delete(data.userId);
          if (conversationTypingUsers.size === 0) {
            newMap.delete(data.conversationId);
          } else {
            newMap.set(data.conversationId, conversationTypingUsers);
          }
        }
        return newMap;
      });
    };

    nextSocket.on("newMessage", handleNewMessage);
    nextSocket.on("newMessage", handleNewMessage);
    nextSocket.on("messageRevoked", handleMessageRevoked);
    nextSocket.on("userStatusChanged", handleUserStatusChanged);
    nextSocket.on("userTyping", handleUserTyping);
    nextSocket.on("userStoppedTyping", handleUserStoppedTyping);

    return () => {
      // Gỡ đúng listener để tránh duplicate khi React StrictMode double-mount
      nextSocket.off("newMessage", handleNewMessage);
      nextSocket.off("messageRevoked", handleMessageRevoked);
      nextSocket.off("userStatusChanged", handleUserStatusChanged);
      nextSocket.off("userTyping", handleUserTyping);
      nextSocket.off("userStoppedTyping", handleUserStoppedTyping);
      nextSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!incomingCall) {
      return;
    }

    const privateConversation = conversations.find(
      (conversation) =>
        conversation.type === "private" &&
        conversation.participants.some(
          (participant) => participant.id === incomingCall.fromUserId,
        ),
    );

    if (
      privateConversation &&
      activeConversationId !== privateConversation.id
    ) {
      setCurrentMode("private");
      setDraftReceiver(null);
      setActiveConversationId(privateConversation.id);
    }
  }, [activeConversationId, conversations, incomingCall]);

  // Handle khi click đổi cuộc trò chuyện: Reset số đếm unread về 0
  const handleSelectConversation = useCallback((id: string) => {
    setDraftReceiver(null);
    setActiveConversationId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    );
  }, []);

  const handleStartPrivateChat = useCallback((user: User) => {
    setCurrentMode("private");
    setDraftReceiver(user);
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  const refreshAfterGroupChange = useCallback(async () => {
    const refreshed = await fetchConversations(currentUserId);
    setConversations(refreshed);

    if (activeConversationId) {
      const stillExists = refreshed.some(
        (conv) => conv.id === activeConversationId,
      );
      if (!stillExists) {
        setActiveConversationId(null);
        setMessages([]);
      }
    }
  }, [activeConversationId, currentUserId]);

  const handleRemoveGroupMember = useCallback(
    async (memberId: string) => {
      if (!activeConversationId) return;
      await removeGroupMember(activeConversationId, memberId);
      await refreshAfterGroupChange();
      setShowGroupManageModal(false);
    },
    [activeConversationId, refreshAfterGroupChange],
  );

  const handleDissolveGroup = useCallback(async () => {
    if (!activeConversationId) return;
    await dissolveGroup(activeConversationId);
    await refreshAfterGroupChange();
    setShowGroupManageModal(false);
  }, [activeConversationId, refreshAfterGroupChange]);

  const handleLeaveGroup = useCallback(
    async (newOwnerId?: string) => {
      if (!activeConversationId) return;
      await leaveGroup(activeConversationId, newOwnerId);
      await refreshAfterGroupChange();
      setShowGroupManageModal(false);
    },
    [activeConversationId, refreshAfterGroupChange],
  );

  const handleOpenGroupManage = useCallback(async () => {
    const currentConversation = conversations.find(
      (conversation) => conversation.id === activeConversationId,
    );

    if (!currentConversation) return;

    setShowGroupManageModal(true);

    if (currentConversation.type !== "class") return;

    try {
      const roleData = await fetchConversationRole(currentConversation.id);
      const owner = currentConversation.participants.find(
        (participant) => participant.id === roleData.ownerId,
      );
      setGroupOwnerTarget(owner || null);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === currentConversation.id
            ? {
                ...conversation,
                ownerId: roleData.ownerId,
                myRole: roleData.myRole,
                canManageGroup: roleData.canManageGroup,
              }
            : conversation,
        ),
      );
    } catch (error) {
      console.error("[ChatLayout] fetchConversationRole error:", error);
      setGroupOwnerTarget(
        currentConversation.ownerId
          ? currentConversation.participants.find(
              (participant) => participant.id === currentConversation.ownerId,
            ) || null
          : null,
      );
    }
  }, [activeConversationId, conversations]);

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

  // ── Fetch call history cho private conversation hiện tại ────────────────
  useEffect(() => {
    const activeConversation = conversations.find(
      (c) => c.id === activeConversationId,
    );
    const isPrivate = activeConversation?.type === "private";

    if (!activeConversationId || !isPrivate) {
      setCallHistory([]);
      setCallHistoryPage(1);
      setCallHistoryTotalPages(1);
      return;
    }

    let mounted = true;

    const loadCallHistory = async () => {
      setIsLoadingCallHistory(true);
      try {
        const response = await fetchCallHistory({
          conversationId: activeConversationId,
          limit: 5,
          page: 1,
        });

        if (!mounted) {
          return;
        }

        setCallHistory(response.items);
        setCallHistoryPage(response.pagination.page);
        setCallHistoryTotalPages(response.pagination.totalPages);
      } catch (historyError) {
        if (!mounted) {
          return;
        }
        console.error("[ChatLayout] fetch call history error:", historyError);
      } finally {
        if (mounted) {
          setIsLoadingCallHistory(false);
        }
      }
    };

    loadCallHistory();

    return () => {
      mounted = false;
    };
  }, [activeConversationId, conversations]);

  useEffect(() => {
    if (callStatus !== "idle") {
      return;
    }

    const activeConversation = conversations.find(
      (c) => c.id === activeConversationId,
    );
    if (!activeConversation || activeConversation.type !== "private") {
      return;
    }

    const refreshCallHistory = async () => {
      try {
        const response = await fetchCallHistory({
          conversationId: activeConversation.id,
          limit: 5,
          page: 1,
        });
        setCallHistory(response.items);
        setCallHistoryPage(response.pagination.page);
        setCallHistoryTotalPages(response.pagination.totalPages);
      } catch (historyError) {
        console.error("[ChatLayout] refresh call history error:", historyError);
      }
    };

    void refreshCallHistory();
  }, [activeConversationId, callStatus, conversations]);

  // ── Gửi tin nhắn ─────────────────────────────────────────────────────────
  const handleSendMessage = async (
    text: string,
    attachments?: Array<{ url: string; fileType: string; fileName: string }>,
    replyToId?: string,
  ) => {
    if (!currentUserId || isSending) return;

    const activeConversation = conversations.find(
      (c) => c.id === activeConversationId,
    );
    const targetReceiver =
      draftReceiver ||
      activeConversation?.participants.find((p) => p.id !== currentUserId) ||
      null;

    if (!activeConversation && !targetReceiver) return;
    if (!activeConversationId && !targetReceiver) return;
    if (activeConversation?.type === "private" && !targetReceiver) return;

    const optimisticConversationId =
      activeConversationId || `draft_${targetReceiver?.id || "unknown"}`;

    // Optimistic UI: hiển thị ngay không chờ server
    const optimisticMessage: Message = {
      id: `optimistic_${Date.now()}`,
      conversationId: optimisticConversationId,
      senderId: currentUserId,
      content: text,
      createdAt: new Date().toISOString(),
      status: "sent",
      attachments: attachments || [],
      replyTo: null,
      isRevoked: false,
      revokedFor: [] as string[],
      reactions: [] as Reaction[],
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    setIsSending(true);
    try {
      // Gọi API thực POST /api/messages
      let savedMessage: Message;
      if (activeConversation?.type === "class") {
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
          targetReceiver?.id,
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

      // Cập nhật lastMessage của conversation trong danh sách và đưa lên đầu
      if (activeConversationId) {
        setConversations((prev) => {
          const index = prev.findIndex((c) => c.id === activeConversationId);
          if (index === -1) return prev;

          const updatedConv = {
            ...prev[index],
            lastMessage: savedMessage,
          };

          const otherConvs = prev.filter((_, i) => i !== index);
          return [updatedConv, ...otherConvs];
        });
      } else if (targetReceiver) {
        const refreshed = await fetchConversations(currentUserId);
        setConversations(refreshed);
        const createdConversation = refreshed.find(
          (conv) =>
            conv.type === "private" &&
            conv.participants.some((p) => p.id === currentUserId) &&
            conv.participants.some((p) => p.id === targetReceiver.id),
        );
        if (createdConversation) {
          setActiveConversationId(createdConversation.id);
          setDraftReceiver(null);
        }
      }
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
    conversations.find((c) => c.id === activeConversationId) ||
    (draftReceiver
      ? {
          id: `draft_${draftReceiver.id}`,
          name: draftReceiver.name,
          type: "private" as const,
          participants: [currentUser as User, draftReceiver],
          lastMessage: null,
          unreadCount: 0,
          avatarUrl: draftReceiver.avatarUrl,
        }
      : null);

  const activePrivatePeer =
    activeConversation?.type === "private"
      ? activeConversation.participants.find(
          (participant) => participant.id !== currentUserId,
        ) || null
      : null;

  const isCallablePrivateConversation =
    activeConversation !== null && !activeConversation.id.startsWith("draft_");

  const canStartVideoCall =
    Boolean(activePrivatePeer) &&
    isCallablePrivateConversation &&
    callStatus === "idle";

  const handleStartVideoCall = useCallback(async () => {
    if (!activeConversation || activeConversation.type !== "private") {
      return;
    }

    if (activeConversation.id.startsWith("draft_")) {
      return;
    }

    const targetPeer = activeConversation.participants.find(
      (participant) => participant.id !== currentUserId,
    );

    if (!targetPeer) {
      return;
    }

    await startVideoCall({
      toUserId: targetPeer.id,
      conversationId: activeConversation.id,
    });
  }, [activeConversation, currentUserId, startVideoCall]);

  const incomingCaller = React.useMemo(() => {
    if (!incomingCall) {
      return null;
    }

    for (const conversation of conversations) {
      const matched = conversation.participants.find(
        (participant) => participant.id === incomingCall.fromUserId,
      );
      if (matched) {
        return matched;
      }
    }

    return null;
  }, [conversations, incomingCall]);

  const suggestedUsers = React.useMemo(() => {
    const privatePeerIds = new Set<string>();
    conversations
      .filter((conv) => conv.type === "private")
      .forEach((conv) => {
        conv.participants.forEach((p) => {
          if (p.id !== currentUserId) privatePeerIds.add(p.id);
        });
      });

    const map = new Map<string, User>();
    conversations
      .filter((conv) => conv.type === "class")
      .forEach((conv) => {
        conv.participants.forEach((p) => {
          if (p.id === currentUserId) return;
          if (privatePeerIds.has(p.id)) return;
          map.set(p.id, p);
        });
      });

    const query = searchQuery.trim().toLowerCase();
    const users = Array.from(map.values());
    if (!query) return [];

    return users
      .filter((u) =>
        [u.name, u.email, u.code]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 20);
  }, [conversations, currentUserId, searchQuery]);

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-155 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 font-sans shadow-sm">
      <Sidebar
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        conversations={conversations}
        suggestedUsers={suggestedUsers}
        currentUser={currentUser}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onStartPrivateChat={handleStartPrivateChat}
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
        socket={socket}
        canStartVideoCall={canStartVideoCall}
        onStartVideoCall={handleStartVideoCall}
        localStream={localStream}
        remoteStream={remoteStream}
        callStatus={callStatus}
        incomingCall={incomingCall}
        incomingCaller={incomingCaller}
        activeCall={activeCall}
        callHistory={callHistory}
        isLoadingCallHistory={isLoadingCallHistory}
        callHistoryPage={callHistoryPage}
        callHistoryTotalPages={callHistoryTotalPages}
        isMicrophoneEnabled={isMicrophoneEnabled}
        isCameraEnabled={isCameraEnabled}
        callError={callError}
        onClearCallError={clearCallError}
        onRetryMediaPermission={retryMediaPermission}
        onAcceptIncomingCall={acceptIncomingCall}
        onDeclineIncomingCall={declineIncomingCall}
        onEndVideoCall={endVideoCall}
        onToggleMicrophone={toggleMicrophone}
        onToggleCamera={toggleCamera}
        onForwardMessage={setForwardMessageTarget}
        onOpenProfile={setProfileTarget}
        onOpenGroupManage={() => void handleOpenGroupManage()}
        typingUsers={activeConversationId ? typingUsers.get(activeConversationId) || new Set() : new Set()}
      />
      {forwardMessageTarget && (
        <ForwardMessageModal
          message={forwardMessageTarget}
          conversations={conversations}
          currentUserId={currentUserId}
          onClose={() => setForwardMessageTarget(null)}
          onSuccess={() => {
            // Có thể thêm Toast notification "Chuyển tiếp thành công" tại đây nếu muốn
          }}
        />
      )}
      {profileTarget && (
        <ChatUserProfileModal
          user={profileTarget}
          onClose={() => setProfileTarget(null)}
        />
      )}
      {showGroupManageModal && activeConversation && currentUser && (
        <ChatGroupManageModal
          conversation={activeConversation}
          currentUser={currentUser}
          onClose={() => setShowGroupManageModal(false)}
          onOpenProfile={setProfileTarget}
          ownerUser={groupOwnerTarget}
          onRemoveMember={handleRemoveGroupMember}
          onDissolveGroup={handleDissolveGroup}
          onLeaveGroup={handleLeaveGroup}
        />
      )}
    </div>
  );
};
