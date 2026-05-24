import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Modal, DeviceEventEmitter } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { Sidebar } from './Sidebar';
import { ChatWindow } from './ChatWindow';
import { IncomingCallModal } from './IncomingCallModal';
import { ForwardMessageModal } from './ForwardMessageModal';
import { ChatUserProfileModal } from './ChatUserProfileModal';
import { ChatGroupManageModal } from './ChatGroupManageModal';
import { GroupCallScreen } from './GroupCallScreen';
import { CallHistoryItem, ChatMode, Conversation, Message, User } from '../types';
import type { MediaCallKind } from '../types';
import {
  fetchConversations,
  fetchCallHistory,
  fetchMessages,
  sendMessage,
  mapApiMessageToMessage,
  fetchConversationRole,
  removeGroupMember,
  dissolveGroup,
  leaveGroup,
} from "../chatApi";
import { Attachment } from "../types";

import { API_URL, getAccessToken } from "../../api";

const CHAT_SERVICE_URL = API_URL;

interface ChatLayoutProps {
  currentUserId: string;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ currentUserId }) => {
  // Mobile specific state to track which view is active
  const [activeView, setActiveView] = useState<"sidebar" | "chat">("sidebar");

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
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [isLoadingCallHistory, setIsLoadingCallHistory] = useState(false);
  const [callHistoryPage, setCallHistoryPage] = useState(1);
  const [callHistoryTotalPages, setCallHistoryTotalPages] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forwardMessageTarget, setForwardMessageTarget] =
    useState<Message | null>(null);
  const [profileTarget, setProfileTarget] = useState<User | null>(null);
  const [showGroupManageModal, setShowGroupManageModal] = useState(false);
  const [groupOwnerTarget, setGroupOwnerTarget] = useState<User | null>(null);
  const [isGroupCallActive, setIsGroupCallActive] = useState(false);
  const [callConversationId, setCallConversationId] = useState<string | null>(null);
  const [callInitiatorUserId, setCallInitiatorUserId] = useState<string | null>(null);
  const [callIsPrivate, setCallIsPrivate] = useState(false);
  const [callMediaKind, setCallMediaKind] = useState<MediaCallKind>('video');
  const [leaveSignal, setLeaveSignal] = useState(0);
  const [incomingCallRequest, setIncomingCallRequest] = useState<{
    conversationId: string;
    initiatorUserId: string;
    isPrivate?: boolean;
    callType?: MediaCallKind;
  } | null>(null);

  // chatMongoId: MongoDB ObjectId của user hiện tại trong chat-service
  const [chatMongoId, setChatMongoId] = useState<string>(currentUserId);

  // currentUser được tìm từ participants dùng chatMongoId
  const currentUser: User | null = React.useMemo(() => {
    if (!chatMongoId) return null;

    const activeConv = conversations.find((c) => c.id === activeConversationId);
    if (activeConv) {
      const found = activeConv.participants.find((p) => p.id === chatMongoId);
      if (found) return found;
    }

    for (const conv of conversations) {
      const found = conv.participants.find((p) => p.id === chatMongoId);
      if (found) return found;
    }

    return {
      id: chatMongoId,
      name: "Bạn",
      avatarUrl: `https://i.pravatar.cc/150?u=${chatMongoId}`,
      isOnline: true,
    };
  }, [conversations, chatMongoId, activeConversationId]);

  const [typingUsers, setTypingUsers] = useState<Record<string, Record<string, string>>>({});

  const socketRef = useRef<Socket | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const isCallActiveRef = useRef(false);
  const conversationsRef = useRef<Conversation[]>([]);
  const callConversationIdRef = useRef<string | null>(null);
  const joinedConversationRoomRef = useRef<string | null>(null);
  const incomingCallRequestRef = useRef<{
    conversationId: string;
    initiatorUserId: string;
    isPrivate?: boolean;
    callType?: MediaCallKind;
  } | null>(null);

  const incomingCallConversation = React.useMemo(
    () => conversations.find((item) => item.id === incomingCallRequest?.conversationId) || null,
    [conversations, incomingCallRequest?.conversationId],
  );

  const incomingCaller = React.useMemo(() => {
    if (!incomingCallRequest) return null;
    const conversation = incomingCallConversation;
    if (!conversation) return null;
    return conversation.participants.find((participant) => participant.id === incomingCallRequest.initiatorUserId) || null;
  }, [incomingCallConversation, incomingCallRequest]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;

    setIsLoadingConversations(true);
    setError(null);

    try {
      const { chatApiClient } = await import("../axiosClient");
      
      // 🚀 TẠO BIẾN TẠM ĐỂ HỨNG ID MONGODB CHUẨN XỊN
      let realMongoId = currentUserId; 

      try {
        const { data: meRes } = await chatApiClient.get<{
          data: { _id: string };
        }>("/me");

        if (meRes?.data?._id) {
          setChatMongoId(meRes.data._id);
          realMongoId = meRes.data._id; // 🚀 Gán ID 24 ký tự vào đây
        }
      } catch {
        // Ignore fallback
      }

      // 🚀 FIX LỖI TÊN: Truyền realMongoId vào đây thay vì currentUserId (Core ID)
      const data = await fetchConversations(realMongoId);
      setConversations(data);
    } catch (err) {
      console.error("[ChatLayout] fetch conversations error:", err);
      setError("Không thể tải danh sách. Kiểm tra lại kết nối.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    isCallActiveRef.current = isGroupCallActive;
  }, [isGroupCallActive]);

  useEffect(() => {
    callConversationIdRef.current = callConversationId;
  }, [callConversationId]);

  useEffect(() => {
    const socket = socketRef.current;
    const roomId = activeConversationId;

    if (!socket) return;

    if (joinedConversationRoomRef.current && joinedConversationRoomRef.current !== roomId) {
      socket.emit('leave_room', { roomId: joinedConversationRoomRef.current });
    }

    if (roomId) {
      socket.emit('joinRoom', roomId);
      joinedConversationRoomRef.current = roomId;
    } else {
      joinedConversationRoomRef.current = null;
    }

    return () => {
      if (socket && joinedConversationRoomRef.current === roomId && roomId) {
        socket.emit('leave_room', { roomId });
      }
    };
  }, [activeConversationId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    incomingCallRequestRef.current = incomingCallRequest;
  }, [incomingCallRequest]);

  useEffect(() => {
    // Chỉ connect socket khi đã có chatMongoId (MongoDB _id) thay vì Postgres accountId
    if (!chatMongoId) return;

    let socket: Socket | null = null;

    const setupSocket = async () => {
      const token = await getAccessToken();
      socket = io(CHAT_SERVICE_URL, {
        path: "/socket.io/",
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
        auth: { userId: chatMongoId, token },
        query: { userId: chatMongoId },
      });

      socketRef.current = socket;

      socket.on("newMessage", (rawMessage: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const incoming = mapApiMessageToMessage(rawMessage as any);
        const isActive =
          activeConversationIdRef.current === incoming.conversationId;
        const isSelf = incoming.senderId === chatMongoId;

        if (isActive) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }

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
      });

      // --- KẾT HỢP: LOGIC TYPING CỦA TEAM ---
      const handleTypingStart = (data: { conversationId: string; userId: string; userName: string }) => {
        if (data.userId === chatMongoId) return;
        setTypingUsers((prev) => ({
          ...prev,
          [data.conversationId]: {
            ...(prev[data.conversationId] || {}),
            [data.userId]: data.userName || 'Người dùng',
          },
        }));
      };

      const handleTypingStop = (data: { conversationId: string; userId: string }) => {
        setTypingUsers((prev) => {
          if (!prev[data.conversationId] || !prev[data.conversationId][data.userId]) return prev;
          const nextConvTyping = { ...prev[data.conversationId] };
          delete nextConvTyping[data.userId];
          return {
            ...prev,
            [data.conversationId]: nextConvTyping,
          };
        });
      };

      socket.on('userTyping', handleTypingStart);
      socket.on('typing', handleTypingStart);
      socket.on('user_typing', handleTypingStart);
      socket.on('user-typing', handleTypingStart);

      socket.on('userStopTyping', handleTypingStop);
      socket.on('stopTyping', handleTypingStop);
      socket.on('user_stop_typing', handleTypingStop);
      socket.on('user-stop-typing', handleTypingStop);

      // --- KẾT HỢP: THU HỒI TIN NHẮN ---
      socket.on('messageRevoked', (data: { messageId: string; revokeType?: string; isRevoked?: boolean }) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.lastMessage?.id === data.messageId) {
              if (data.revokeType === 'self') {
                return {
                  ...c,
                  lastMessage: {
                    ...c.lastMessage,
                    revokedFor: [
                      ...(c.lastMessage.revokedFor || []),
                      "__self__",
                    ],
                  },
                };
              }
              return {
                ...c,
                lastMessage: { ...c.lastMessage, isRevoked: true },
              };
            }
            return c;
          })
        );
      });

      socket.on('incomingGroupMediaCall', (payload: { conversationId: string; initiatorUserId: string; callType?: MediaCallKind; isPrivate?: boolean }) => {
        if (!payload?.conversationId || payload.initiatorUserId === chatMongoId) return;
        if (isCallActiveRef.current || incomingCallRequestRef.current) return;
        const matchedConversation = conversationsRef.current.find(
          (item) => item.id === payload.conversationId,
        );
        setIncomingCallRequest({
          conversationId: payload.conversationId,
          initiatorUserId: payload.initiatorUserId,
          isPrivate: payload.isPrivate ?? matchedConversation?.type === 'private',
          callType: payload.callType ?? 'video',
        });
        setActiveConversationId(payload.conversationId);
        setActiveView('chat');
      });

      const handleCallEnded = ({
        conversationId,
      }: {
        conversationId: string;
        endedByUserId?: string;
        reason?: string;
      }) => {
        if (!callConversationIdRef.current || callConversationIdRef.current !== conversationId) {
          return;
        }
        setIsGroupCallActive(false);
        setCallConversationId(null);
        setCallInitiatorUserId(null);
        setCallIsPrivate(false);
        setCallMediaKind('video');
      };

      socket.on('callEnded', handleCallEnded);
      socket.on('videoCallEnded', handleCallEnded);
      // 1. Khi có người gửi lời mời kết bạn MỚI (Khớp với backend: "friend_status_updated")
      socket.on('friend_status_updated', (data) => { 
        console.log("🔥 [Socket] Trạng thái bạn bè thay đổi (có thể là kết bạn mới)!", data);
        DeviceEventEmitter.emit('SYNC_FRIENDS_DATA'); 
      });

      // 2. Khi người ta ĐỒNG Ý kết bạn (Khớp với backend: "friend_request_accepted")
      socket.on('friend_request_accepted', (data) => {
        console.log("🔥 [Socket] Có người đồng ý kết bạn nè!", data);
        DeviceEventEmitter.emit('SYNC_FRIENDS_DATA'); 
        loadConversations();
      });
      
      // 3. Khi người ta TỪ CHỐI kết bạn (Khớp với backend: "friend_request_rejected")
      socket.on('friend_request_rejected', (data) => {
        console.log("🔥 [Socket] Nó từ chối kết bạn rồi!", data);
        DeviceEventEmitter.emit('SYNC_FRIENDS_DATA'); 
      });

      // 4. Nghe sự kiện: Ai đó vừa tạo nhóm mới và có tên mình trong đó
      socket.on('new_group_created', (data) => {
        console.log("🔥 [Socket] Vừa được kéo vào nhóm mới tạo nè!", data);
        // Load lại Sidebar để nhóm mới hiện ra ngay lập tức
        loadConversations(); 
      });

      // 5. Nghe sự kiện: Mình vừa bị Admin add vào một nhóm đã có sẵn
      socket.on('added_to_group', (data) => {
        console.log("🔥 [Socket] Vừa bị nhét vào nhóm cũ!", data);
        loadConversations(); 
      });

      // 6. Nghe sự kiện: Nhóm mình đang tham gia vừa có thành viên mới chui vào
      socket.on('group_updated', (data) => {
        console.log("🔥 [Socket] Nhóm có người mới vào / người cũ ra!", data);
        // Load lại để cập nhật số lượng thành viên (hoặc tên nhóm)
        loadConversations(); 
      });
    };

    setupSocket();

    return () => {
      if (socket) {
        socket.off("newMessage");
        socket.off("messageRevoked");
        socket.off("new_group_created");
        socket.off("added_to_group");
        socket.off("group_updated");
        socket.off("friend_status_updated");
        socket.off("friend_request_rejected");
        socket.off("friend_request_accepted");
        socket.off('incomingGroupMediaCall');
        socket.off('callEnded');
        socket.off('videoCallEnded');
        socket.off('userTyping');
        socket.off('userStopTyping');
        socket.disconnect();
      }
    };
  }, [chatMongoId, loadConversations]);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (!socketRef.current || !activeConversationIdRef.current || !currentUser) return;
    if (isTyping) {
      socketRef.current.emit('userTyping', {
        conversationId: activeConversationIdRef.current,
        userId: currentUser.id,
        userName: currentUser.name,
      });
    } else {
      socketRef.current.emit('userStoppedTyping', {
        conversationId: activeConversationIdRef.current,
        userId: currentUser.id,
      });
    }
  }, [currentUser]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      setCallHistory([]);
      return;
    }

    const load = async () => {
      setIsLoadingMessages(true);
      setIsLoadingCallHistory(true);
      try {
        const [messagesData, callHistoryData] = await Promise.all([
          fetchMessages(activeConversationId),
          fetchCallHistory({ conversationId: activeConversationId, limit: 50, page: 1 }),
        ]);
        setMessages(messagesData);
        setCallHistory(callHistoryData.items || []);
        setCallHistoryPage(callHistoryData.pagination?.page || 1);
        setCallHistoryTotalPages(callHistoryData.pagination?.totalPages || 1);
      } catch (err) {
        console.error('[ChatLayout] fetch messages error:', err);
        setCallHistory([]);
      } finally {
        setIsLoadingMessages(false);
        setIsLoadingCallHistory(false);
      }
    };

    load();
  }, [activeConversationId]);

  const handleSelectConversation = useCallback((id: string) => {
    setDraftReceiver(null);
    setActiveConversationId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    );
    setActiveView("chat"); // Switch view for mobile
  }, []);

  const handleStartPrivateChat = useCallback((user: User) => {
    setCurrentMode("private");
    setDraftReceiver(user);
    setActiveConversationId(null);
    setMessages([]);
    setActiveView("chat"); // Switch view for mobile
  }, []);

  const handleBackToSidebar = useCallback(() => {
    setActiveConversationId(null);
    setActiveView("sidebar");
  }, []);

  const handleOpenProfile = useCallback((user: User) => {
    setProfileTarget(user);
  }, []);

  const handleOpenGroupManage = useCallback(async () => {
    const conversation = conversations.find(
      (item) => item.id === activeConversationId,
    );
    if (!conversation || conversation.type !== "class") return;

    try {
      const roleData = await fetchConversationRole(conversation.id);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id
            ? {
                ...c,
                ownerId: roleData.ownerId,
                myRole: roleData.myRole,
                canManageGroup: roleData.canManageGroup,
              }
            : c,
        ),
      );

      const owner = roleData.ownerId
        ? conversation.participants.find((p) => p.id === roleData.ownerId) ||
          null
        : null;
      setGroupOwnerTarget(owner);
    } catch (err) {
      console.error("[ChatLayout] fetch role error:", err);
      setGroupOwnerTarget(
        conversation.ownerId
          ? conversation.participants.find(
              (participant) => participant.id === conversation.ownerId,
            ) || null
          : null,
      );
    }

    setShowGroupManageModal(true);
  }, [activeConversationId, conversations]);

  const handleRemoveGroupMember = useCallback(
    async (memberId: string) => {
      if (!activeConversationId) return;
      try {
        await removeGroupMember(activeConversationId, memberId);
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === activeConversationId
              ? {
                  ...conversation,
                  participants: conversation.participants.filter(
                    (participant) => participant.id !== memberId,
                  ),
                }
              : conversation,
          ),
        );
      } catch (err) {
        console.error("[ChatLayout] remove member error:", err);
        setError("Không thể xóa thành viên. Vui lòng thử lại.");
      }
    },
    [activeConversationId],
  );

  const handleDissolveGroup = useCallback(async () => {
    if (!activeConversationId) return;
    try {
      await dissolveGroup(activeConversationId);
      setConversations((prev) =>
        prev.filter((conversation) => conversation.id !== activeConversationId),
      );
      setActiveConversationId(null);
      setActiveView("sidebar");
    } catch (err) {
      console.error("[ChatLayout] dissolve group error:", err);
      setError("Không thể giải tán nhóm.");
    }
  }, [activeConversationId]);

  const handleLeaveGroup = useCallback(
    async (newOwnerId?: string) => {
      if (!activeConversationId || !currentUser) return;

      try {
        await leaveGroup(activeConversationId, newOwnerId);
        setConversations((prev) =>
          prev.filter((c) => c.id !== activeConversationId),
        );
        setActiveConversationId(null);
        setActiveView("sidebar");
      } catch (err) {
        console.error("[ChatLayout] leave group error:", err);
        setError("Không thể rời nhóm.");
      }
    },
    [activeConversationId, currentUser],
  );

  const handleSendMessage = async (
    text: string,
    attachments?: Attachment[],
    replyToId?: string,
  ) => {
    if (!currentUserId || isSending) return;

    const activeConversation = conversations.find((c) => c.id === activeConversationId);
    const selfChatId = chatMongoId || currentUserId;
    const targetReceiver =
      draftReceiver ||
      // 🚀 VÁ LỖI TÌM SAI NGƯỜI NHẬN: Dùng selfChatId để loại trừ chính mình ra
      activeConversation?.participants.find((p) => p.id !== selfChatId) ||
      null;

    if (!activeConversation && !targetReceiver) return;
    if (!activeConversationId && !targetReceiver) return;

    const optimisticConversationId =
      activeConversationId || `draft_${targetReceiver?.id || "unknown"}`;

    const optimisticMessage: Message = {
      id: `optimistic_${Date.now()}`,
      conversationId: optimisticConversationId,
      // 🚀 VÁ LỖI SENDER ID: Dùng selfChatId để khớp với Backend
      senderId: selfChatId,
      content: text,
      createdAt: new Date().toISOString(),
      status: "sent",
      attachments: attachments || [],
      replyTo: undefined,
      isRevoked: false,
      revokedFor: [],
      reactions: [],
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    setIsSending(true);
    try {
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
          // 🚀 VÁ LỖI MẤT TIN NHẮN: Truyền ID phòng chat vào đây
          activeConversation?.id, 
          attachments,
          replyToId,
        );
      }

      setMessages((prev) => {
        const alreadyHasSocketMess = prev.some((m) => m.id === savedMessage.id);
        if (alreadyHasSocketMess) {
          return prev.filter((m) => m.id !== optimisticMessage.id);
        } else {
          return prev.map((m) =>
            m.id === optimisticMessage.id ? savedMessage : m,
          );
        }
      });

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
        const refreshed = await fetchConversations(selfChatId);
        setConversations(refreshed);
        const createdConversation = refreshed.find(
          (conv) =>
            conv.type === 'private' &&
            conv.participants.some((p) => p.id === selfChatId) &&
            conv.participants.some((p) => p.id === targetReceiver.id)
        );
        if (createdConversation) {
          setActiveConversationId(createdConversation.id);
          setDraftReceiver(null);
        }
      }
    } catch (err) {
      console.error("[ChatLayout] send error:", err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
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

  const privatePeer = React.useMemo(() => {
    if (!activeConversation || activeConversation.type !== 'private') return null;
    const selfId = chatMongoId || currentUser?.id || currentUserId;
    return (
      activeConversation.participants.find((p) => p.id !== selfId) ||
      activeConversation.participants.find((p) =>
        (currentUser?.email ? p.email !== currentUser.email : false) ||
        (currentUser?.code ? p.code !== currentUser.code : false) ||
        (currentUser?.name ? p.name !== currentUser.name : false)
      ) ||
      activeConversation.participants[0] ||
      null
    );
  }, [activeConversation, chatMongoId, currentUser?.id, currentUserId]);

  const isPrivateConversation = activeConversation?.type === 'private';
  const callConversation = conversations.find((c) => c.id === callConversationId) || activeConversation;
  const callConversationType = callConversation?.type ?? 'class';
  const participantNames = React.useMemo(() => {
    if (!callConversation) return {};
    return Object.fromEntries(callConversation.participants.map((p) => [p.id, p.name]));
  }, [callConversation]);

  const suggestedUsers = React.useMemo(() => {
    const privatePeerIds = new Set<string>();
    conversations
      .filter((conv) => conv.type === "private")
      .forEach((conv) => {
        conv.participants.forEach((p) => {
          // 🚀 LOẠI TRỪ BẢN THÂN DÙNG chatMongoId
          if (p.id !== chatMongoId) privatePeerIds.add(p.id);
        });
      });

    const map = new Map<string, User>();
    conversations
      .filter((conv) => conv.type === "class")
      .forEach((conv) => {
        conv.participants.forEach((p) => {
          // 🚀 LOẠI TRỪ BẢN THÂN DÙNG chatMongoId
          if (p.id === chatMongoId) return; 
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
  }, [conversations, chatMongoId, searchQuery]);

    const handleStartVideoCall = useCallback(() => {
    if (!activeConversation || activeConversation.id.startsWith('draft_')) return;
    setCallConversationId(activeConversation.id);
    setCallInitiatorUserId(chatMongoId || currentUserId);
    setCallIsPrivate(true);
    setCallMediaKind('video');
    setIncomingCallRequest(null);
    setIsGroupCallActive(true);
  }, [activeConversation, chatMongoId, currentUserId]);

  const handleStartVoiceCall = useCallback(() => {
    if (!activeConversation || activeConversation.id.startsWith('draft_')) return;
    setCallConversationId(activeConversation.id);
    setCallInitiatorUserId(chatMongoId || currentUserId);
    setCallIsPrivate(true);
    setCallMediaKind('audio');
    setIncomingCallRequest(null);
    setIsGroupCallActive(true);
  }, [activeConversation, chatMongoId, currentUserId]);

  const handleStartGroupCall = useCallback((callType: MediaCallKind = 'video') => {
    if (!activeConversationId) return;
    setCallConversationId(activeConversationId);
    setCallInitiatorUserId(chatMongoId || currentUserId);
    setCallIsPrivate(false);
    setCallMediaKind(callType);
    setIncomingCallRequest(null);
    setIsGroupCallActive(true);
  }, [activeConversationId, chatMongoId, currentUserId]);

  const handleAcceptIncomingCall = useCallback(() => {
    if (!incomingCallRequest) return;
    setCallConversationId(incomingCallRequest.conversationId);
    setCallInitiatorUserId(incomingCallRequest.initiatorUserId);
    setCallIsPrivate(Boolean(incomingCallRequest.isPrivate));
    setCallMediaKind(incomingCallRequest.callType ?? 'video');
    setIncomingCallRequest(null);
    setIsGroupCallActive(true);
  }, [incomingCallRequest]);

  const handleDeclineIncomingCall = useCallback(() => {
    if (!incomingCallRequest) {
      setIncomingCallRequest(null);
      return;
    }

    const socket = socketRef.current;
    const conversationId = incomingCallRequest.conversationId;
    const activeType =
      activeConversation?.id === conversationId ? activeConversation.type : undefined;
    const conversationType = incomingCallRequest.isPrivate
      ? 'private'
      : activeType ?? conversations.find((item) => item.id === conversationId)?.type ?? 'class';

    if (socket) {
      if (conversationType === 'private') {
        socket.emit('declineMediaCall', { conversationId });
      } else {
        socket.emit('leaveMediaRoom', conversationId);
      }
    }

    setIncomingCallRequest(null);
  }, [activeConversation, conversations, incomingCallRequest]);

  const handleRequestLeaveCall = useCallback(() => {
    if (!isGroupCallActive) return;
    setLeaveSignal((prev) => prev + 1);
  }, [isGroupCallActive]);

  return (
    <View style={styles.container}>
      {activeView === "sidebar" ? (
        <Sidebar
          currentMode={currentMode}
          onModeChange={setCurrentMode}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          conversations={conversations}
          suggestedUsers={suggestedUsers}
          currentUser={currentUser}
          currentUserId={chatMongoId || currentUser?.id || currentUserId}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onStartPrivateChat={handleStartPrivateChat}
          isLoading={isLoadingConversations}
          error={error}
        />
      ) : (
        <>
          <Modal
            visible={activeView === 'chat'}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={handleBackToSidebar}
          >
            <ChatWindow
              conversation={activeConversation}
              messages={messages}
              currentUser={currentUser}
              currentUserId={chatMongoId || currentUser?.id || currentUserId}
              privatePeer={privatePeer}
              onSendMessage={handleSendMessage}
              isLoadingMessages={isLoadingMessages}
              isSending={isSending}
              callHistory={callHistory}
              isLoadingCallHistory={isLoadingCallHistory}
              callHistoryPage={callHistoryPage}
              callHistoryTotalPages={callHistoryTotalPages}
              onBack={handleBackToSidebar}
              socket={socketRef.current}
              onForwardMessage={setForwardMessageTarget}
              onOpenProfile={handleOpenProfile}
              onOpenGroupManage={handleOpenGroupManage}
              onStartVoiceCall={isPrivateConversation ? handleStartVoiceCall : undefined}
              onStartVideoCall={isPrivateConversation ? handleStartVideoCall : undefined}
              onStartGroupCall={!isPrivateConversation ? handleStartGroupCall : undefined}
              isCallActive={isGroupCallActive}
            />
          </Modal>

          <Modal
            visible={isGroupCallActive}
            animationType="slide"
            statusBarTranslucent
            onRequestClose={handleRequestLeaveCall}
          >
            {callConversationId && (
              <GroupCallScreen
                conversationId={callConversationId}
                currentUserId={chatMongoId}
                socket={socketRef.current}
                participantNames={participantNames}
                conversationType={callIsPrivate ? 'private' : callConversationType}
                callType={callMediaKind}
                initiatorUserId={callInitiatorUserId}
                leaveSignal={leaveSignal}
                onLeave={() => {
                  setIsGroupCallActive(false);
                  setCallConversationId(null);
                  setCallInitiatorUserId(null);
                  setCallIsPrivate(false);
                  setCallMediaKind('video');
                }}
              />
            )}
          </Modal>

          <IncomingCallModal
            visible={Boolean(incomingCallRequest)}
            callType={incomingCallRequest?.callType ?? 'video'}
            isPrivate={Boolean(incomingCallRequest?.isPrivate)}
            callerName={incomingCaller?.name ?? null}
            conversationName={incomingCallConversation?.name ?? null}
            onAccept={handleAcceptIncomingCall}
            onDecline={handleDeclineIncomingCall}
          />

          {forwardMessageTarget && (
            <ForwardMessageModal
              visible={!!forwardMessageTarget}
              message={forwardMessageTarget}
              conversations={conversations}
              currentUserId={chatMongoId}
              onClose={() => setForwardMessageTarget(null)}
              onSuccess={() => setForwardMessageTarget(null)}
            />
          )}

          <ChatUserProfileModal
            visible={!!profileTarget}
            user={profileTarget}
            onClose={() => setProfileTarget(null)}
          />

          <ChatGroupManageModal
            visible={showGroupManageModal}
            conversation={activeConversation}
            currentUser={currentUser}
            ownerUser={groupOwnerTarget}
            onClose={() => setShowGroupManageModal(false)}
            onOpenProfile={handleOpenProfile}
            onRemoveMember={handleRemoveGroupMember}
            onDissolveGroup={handleDissolveGroup}
            onLeaveGroup={handleLeaveGroup}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
