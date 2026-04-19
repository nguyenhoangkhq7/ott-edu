import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Socket } from 'socket.io-client';
import { Conversation, Message, User, Attachment, Reaction } from '../types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUser: User | null;
  onSendMessage: (text: string, attachments?: Attachment[], replyToId?: string) => Promise<void>;
  isLoadingMessages: boolean;
  isSending: boolean;
  onBack: () => void;
  socket: Socket | null;
  onForwardMessage?: (message: Message) => void;
  onOpenProfile?: (user: User) => void;
  onOpenGroupManage?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  isLoadingMessages,
  isSending,
  onBack,
  socket,
  onForwardMessage,
  onOpenProfile,
  onOpenGroupManage,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);

  // Sync messages from parent
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Socket listeners for react + revoke
  useEffect(() => {
    if (!socket || !conversation) return;

    const handleReacted = (data: { messageId: string; reactions: Reaction[] }) => {
      setLocalMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, reactions: data.reactions } : m))
      );
    };

    const handleRevoked = (data: { messageId: string; revokeType?: string; isRevoked?: boolean }) => {
      setLocalMessages((prev) =>
        prev.map((m) => {
          if (m.id !== data.messageId) return m;
          if (data.revokeType === 'self') return m; // handleRevokeForMe already optimistically updated this
          return { ...m, isRevoked: true };
        })
      );
    };

    socket.on('messageReacted', handleReacted);
    socket.on('messageRevoked', handleRevoked);

    return () => {
      socket.off('messageReacted', handleReacted);
      socket.off('messageRevoked', handleRevoked);
    };
  }, [socket, conversation]);

  const handleReact = (messageId: string, emoji: string) => {
    // Optimistic update
    setLocalMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions || [];
        const hasMyReaction = existing.some(
          (r) => r.emoji === emoji && r.userId === (currentUser?.id || '')
        );
        const updated = hasMyReaction
          ? existing.filter((r) => !(r.emoji === emoji && r.userId === (currentUser?.id || '')))
          : [...existing, { emoji, userId: currentUser?.id || '' }];
        return { ...m, reactions: updated };
      })
    );
    if (socket && conversation) {
      socket.emit('reactMessage', { messageId, conversationId: conversation.id, emoji });
    }
  };

  const handleRevokeForAll = (messageId: string) => {
    if (!socket || !conversation) return;
    // Optimistic update
    setLocalMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isRevoked: true } : m))
    );
    socket.emit('revokeForAll', { messageId, conversationId: conversation.id });
    // Listen for error
    socket.once('revokeError', (err: { messageId: string; error: string }) => {
      if (err.messageId === messageId) {
        console.warn('[Revoke]', err.error);
        // Rollback on error
        setLocalMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isRevoked: false } : m))
        );
      }
    });
  };

  const handleRevokeForMe = (messageId: string) => {
    if (!socket || !conversation) return;
    // Optimistic: ẩn ngay cho mình
    if (currentUser?.id) {
      setLocalMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, revokedFor: [...(m.revokedFor || []), currentUser.id] }
            : m
        )
      );
    }
    socket.emit('revokeForMe', { messageId, conversationId: conversation.id });
  };

  if (!conversation) {
    return (
      <View style={styles.emptyScreen}>
        <View style={styles.emptyIcon}>
          <Ionicons name="chatbubbles" size={36} color="#3b82f6" />
        </View>
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 16 }} />
      </View>
    );
  }

  const isPrivate = conversation.type === 'private';
  const otherParticipant = isPrivate
    ? conversation.participants.find((p) => p.id !== currentUser?.id)
    : null;

  const chatName = conversation.name || (isPrivate ? otherParticipant?.name : conversation.participants.map((p) => p.name).join(', '));
  const chatAvatar = conversation.avatarUrl || (isPrivate
    ? otherParticipant?.avatarUrl || `https://i.pravatar.cc/150?u=${otherParticipant?.id}`
    : `https://i.pravatar.cc/150?img=30`);
  const headerUser = isPrivate ? otherParticipant || null : conversation.participants.find((p) => p.id === conversation.ownerId) || null;

  const invertedMessages = [...localMessages].reverse();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#0F172A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerAvatarWrap}
          activeOpacity={0.85}
          onPress={() => {
            if (isPrivate && headerUser) {
              onOpenProfile?.(headerUser);
              return;
            }
            if (!isPrivate) {
              onOpenGroupManage?.();
            }
          }}
        >
          <Image source={{ uri: chatAvatar }} style={styles.headerAvatar} />
          {isPrivate && otherParticipant?.isOnline && <View style={styles.onlineDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfo}
          activeOpacity={0.7}
          onPress={() => {
            if (isPrivate && headerUser) {
              onOpenProfile?.(headerUser);
              return;
            }
            if (!isPrivate) {
              onOpenGroupManage?.();
            }
          }}
        >
          <Text style={styles.headerName} numberOfLines={1}>
            {chatName}
          </Text>
          <Text
            style={[
              styles.headerStatus,
              isPrivate && otherParticipant?.isOnline && styles.headerStatusOnline,
            ]}
          >
            {isPrivate
              ? otherParticipant?.isOnline
                ? '● Đang hoạt động'
                : 'Ngoại tuyến'
              : `${conversation?.participants?.length || 0} thành viên`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoBtn}
          onPress={() => {
            if (isPrivate && headerUser) {
              onOpenProfile?.(headerUser);
              return;
            }
            onOpenGroupManage?.();
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Messages - flex:1 sẽ thu lại khi bàn phím mở */}
      <View style={styles.messageList}>
        {isLoadingMessages ? (
          <View style={styles.emptyScreen}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={invertedMessages}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={{ paddingHorizontal: 4, paddingVertical: 12 }}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => {
              const isSelf = item.senderId === currentUser?.id;
              const sender = conversation.participants.find((p) => p.id === item.senderId);
              const nextMessage = invertedMessages[index + 1];
              const isConsecutive = nextMessage && nextMessage.senderId === item.senderId;
              const showTime = !nextMessage || (
                new Date(item.createdAt).getTime() - new Date(nextMessage.createdAt).getTime() > 5 * 60 * 1000
              );

              return (
                <>
                  <MessageBubble
                    message={item}
                    isSelf={isSelf}
                    currentUserId={currentUser?.id}
                    sender={sender}
                    onReply={setReplyingTo}
                    onReact={handleReact}
                    onRevokeForAll={handleRevokeForAll}
                    onRevokeForMe={handleRevokeForMe}
                    onForward={onForwardMessage}
                    onOpenProfile={onOpenProfile}
                    showAvatar={!isSelf && !isConsecutive}
                  />
                  {!isConsecutive && <View style={{ height: 6 }} />}
                </>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <View style={styles.emptyMsgIcon}>
                  <Ionicons name="chatbubbles-outline" size={38} color="#93C5FD" />
                </View>
                <Text style={styles.emptyMsgTitle}>Chưa có tin nhắn</Text>
                <Text style={styles.emptyMsgText}>Gửi lời chào để bắt đầu trò chuyện 👋</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Input - nằm trực tiếp dưới KeyboardAvoidingView, tự được đẩy lên */}
      <MessageInput
        onSend={onSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={isLoadingMessages}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  emptyScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#DBEAFE',
    alignItems: 'center', justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarWrap: { position: 'relative', marginRight: 10 },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#E2E8F0',
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2, borderColor: '#FFF',
  },
  headerInfo: { flex: 1 },
  headerName: {
    fontSize: 16, fontWeight: '700', color: '#0F172A', letterSpacing: -0.2,
  },
  headerStatus: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  headerStatusOnline: { color: '#22C55E', fontWeight: '600' },
  infoBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  messageList: { flex: 1 },
  emptyMessages: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyMsgIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyMsgTitle: {
    fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 6,
  },
  emptyMsgText: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
});

