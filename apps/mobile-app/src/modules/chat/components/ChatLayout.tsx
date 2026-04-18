import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { Sidebar } from './Sidebar';
import { ChatWindow } from './ChatWindow';
import { ForwardMessageModal } from './ForwardMessageModal';
import { ChatMode, Conversation, Message, User } from '../types';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  mapApiMessageToMessage,
} from '../chatApi';
import { Attachment } from '../types';

import { API_URL, getAccessToken } from '../../api';

const CHAT_SERVICE_URL = API_URL;

interface ChatLayoutProps {
  currentUserId: string;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ currentUserId }) => {
  // Mobile specific state to track which view is active
  const [activeView, setActiveView] = useState<'sidebar' | 'chat'>('sidebar');

  const [currentMode, setCurrentMode] = useState<ChatMode>('private');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [draftReceiver, setDraftReceiver] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forwardMessageTarget, setForwardMessageTarget] = useState<Message | null>(null);

  // chatMongoId: MongoDB ObjectId của user hiện tại trong chat-service
  // (khác với currentUserId dạng số từ core-service)
  const [chatMongoId, setChatMongoId] = useState<string>(currentUserId);

  // currentUser được tìm từ participants dùng chatMongoId
  const currentUser: User | null =
    conversations.length > 0
      ? conversations[0].participants.find((p) => p.id === chatMongoId) || {
          id: chatMongoId,
          name: 'Bạn',
          avatarUrl: `https://i.pravatar.cc/150?u=${chatMongoId}`,
          isOnline: true,
        }
      : {
          id: chatMongoId,
          name: 'Bạn',
          avatarUrl: `https://i.pravatar.cc/150?u=${chatMongoId}`,
          isOnline: true,
        };

  const socketRef = useRef<Socket | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);


  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    // Chỉ connect socket khi đã có chatMongoId (MongoDB _id) thay vì Postgres accountId
    if (!chatMongoId) return;

    let socket: Socket | null = null;

    const setupSocket = async () => {
      const token = await getAccessToken();
      socket = io(CHAT_SERVICE_URL, {
        path: '/socket.io/',
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
        auth: { userId: chatMongoId, token },
        query: { userId: chatMongoId },
      });

      socketRef.current = socket;

      socket.on('newMessage', (rawMessage: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const incoming = mapApiMessageToMessage(rawMessage as any);
        const isActive = activeConversationIdRef.current === incoming.conversationId;
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
            unreadCount: shouldIncrement ? prev[index].unreadCount + 1 : prev[index].unreadCount,
          };

          const otherConvs = prev.filter((_, i) => i !== index);
          return [updatedConv, ...otherConvs];
        });
      });

      // Update sidebar khi có tin nhắn bị thu hồi
      socket.on('messageRevoked', (data: { messageId: string; revokeType?: string; isRevoked?: boolean }) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.lastMessage?.id === data.messageId) {
              if (data.revokeType === 'self') {
                return {
                  ...c,
                  lastMessage: {
                    ...c.lastMessage,
                    revokedFor: [...(c.lastMessage.revokedFor || []), '__self__'],
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
    };

    setupSocket();

    return () => {
      if (socket) {
        socket.off('newMessage');
        socket.off('messageRevoked');
        socket.disconnect();
      }
    };
  }, [chatMongoId]);

  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoadingConversations(true);
    setError(null);
    try {
      // Fetch /me từ chat-service để lấy MongoDB ObjectId thực của user
      const { chatApiClient } = await import('../axiosClient');
      try {
        const { data: meRes } = await chatApiClient.get<{ data: { _id: string } }>('/me');
        if (meRes?.data?._id) {
          setChatMongoId(meRes.data._id);
        }
      } catch {
        // Ignore - sẽ dùng fallback từ conversations
      }

      const data = await fetchConversations(currentUserId);
      setConversations(data);

      // Fallback: nếu chưa có MongoDB ID, tìm trong participants
      // (những user không phải currentUserId đều là người khác - user của ta sẽ lộ diện ở conversations 2 chiều)
      if (data.length > 0) {
        // Tìm ID xuất hiện trong mọi conversation của mình (chính là mình)
        // Cách đơn giản: chat /me đã fetch ở trên, nếu fail thì để nguyên chatMongoId
      }
    } catch (err) {
      console.error('[ChatLayout] fetch conversations error:', err);
      setError('Không thể tải danh sách. Kiểm tra lại kết nối.');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUserId]);


  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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
        console.error('[ChatLayout] fetch messages error:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    load();
  }, [activeConversationId]);

  const handleSelectConversation = useCallback((id: string) => {
    setDraftReceiver(null);
    setActiveConversationId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
    setActiveView('chat'); // Switch view for mobile
  }, []);

  const handleStartPrivateChat = useCallback((user: User) => {
    setCurrentMode('private');
    setDraftReceiver(user);
    setActiveConversationId(null);
    setMessages([]);
    setActiveView('chat'); // Switch view for mobile
  }, []);

  const handleBackToSidebar = useCallback(() => {
    setActiveConversationId(null); // Optional: clear active to stop fetching/socket mark read if going back
    setActiveView('sidebar');
  }, []);

  const handleSendMessage = async (
    text: string,
    attachments?: Attachment[],
    replyToId?: string
  ) => {
    if (!currentUserId || isSending) return;

    const activeConversation = conversations.find((c) => c.id === activeConversationId);
    const targetReceiver =
      draftReceiver ||
      activeConversation?.participants.find((p) => p.id !== currentUserId) ||
      null;

    if (!activeConversation && !targetReceiver) return;
    if (!activeConversationId && !targetReceiver) return;

    const optimisticConversationId =
      activeConversationId || `draft_${targetReceiver?.id || 'unknown'}`;

    const optimisticMessage: Message = {
      id: `optimistic_${Date.now()}`,
      conversationId: optimisticConversationId,
      senderId: currentUserId,
      content: text,
      createdAt: new Date().toISOString(),
      status: 'sent',
      attachments: attachments || [],
      replyTo: undefined, // simplify logic for now
      isRevoked: false,
      reactions: [],
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    setIsSending(true);
    try {
      let savedMessage: Message;
      if (activeConversation?.type === 'class') {
        savedMessage = await sendMessage(text, undefined, activeConversation.id, attachments, replyToId);
      } else {
        savedMessage = await sendMessage(text, targetReceiver?.id, undefined, attachments, replyToId);
      }

      setMessages((prev) => {
        const alreadyHasSocketMess = prev.some((m) => m.id === savedMessage.id);
        if (alreadyHasSocketMess) {
          return prev.filter((m) => m.id !== optimisticMessage.id);
        } else {
          return prev.map((m) => (m.id === optimisticMessage.id ? savedMessage : m));
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
        const refreshed = await fetchConversations(currentUserId);
        setConversations(refreshed);
        const createdConversation = refreshed.find(
          (conv) =>
            conv.type === 'private' &&
            conv.participants.some((p) => p.id === currentUserId) &&
            conv.participants.some((p) => p.id === targetReceiver.id)
        );
        if (createdConversation) {
          setActiveConversationId(createdConversation.id);
          setDraftReceiver(null);
        }
      }
    } catch (err) {
      console.error('[ChatLayout] send error:', err);
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
          type: 'private' as const,
          participants: [currentUser as User, draftReceiver],
          lastMessage: null,
          unreadCount: 0,
          avatarUrl: draftReceiver.avatarUrl,
        }
      : null);

  const suggestedUsers = React.useMemo(() => {
    const privatePeerIds = new Set<string>();
    conversations
      .filter((conv) => conv.type === 'private')
      .forEach((conv) => {
        conv.participants.forEach((p) => {
          if (p.id !== currentUserId) privatePeerIds.add(p.id);
        });
      });

    const map = new Map<string, User>();
    conversations
      .filter((conv) => conv.type === 'class')
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
        [u.name, u.email, u.code].filter(Boolean).join(' ').toLowerCase().includes(query)
      )
      .slice(0, 20);
  }, [conversations, currentUserId, searchQuery]);

  return (
    <View style={styles.container}>
      {activeView === 'sidebar' ? (
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
      ) : (
        <ChatWindow
          conversation={activeConversation}
          messages={messages}
          currentUser={currentUser}
          onSendMessage={handleSendMessage}
          isLoadingMessages={isLoadingMessages}
          isSending={isSending}
          onBack={handleBackToSidebar}
          socket={socketRef.current}
          onForwardMessage={setForwardMessageTarget}
        />
      )}

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
