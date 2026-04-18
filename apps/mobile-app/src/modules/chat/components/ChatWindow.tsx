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
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  isLoadingMessages,
  onBack,
  socket,
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

    const handleRevoked = (data: { messageId: string; isRevoked: boolean }) => {
      setLocalMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, isRevoked: data.isRevoked } : m))
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
    // Optimistic update ngay lập tức không chờ socket
    setLocalMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions || [];
        // Toggle: nếu đã có emoji này của mình thì bỏ, chưa có thì thêm
        const hasMyReaction = existing.some(
          (r) => r.emoji === emoji && r.userId === (currentUser?.id || '')
        );
        const updated = hasMyReaction
          ? existing.filter((r) => !(r.emoji === emoji && r.userId === (currentUser?.id || '')))
          : [...existing, { emoji, userId: currentUser?.id || '' }];
        return { ...m, reactions: updated };
      })
    );
    // Emit socket (server sẽ broadcast cho các client khác)
    if (socket && conversation) {
      socket.emit('reactMessage', { messageId, conversationId: conversation.id, emoji });
    }
  };

  const handleRevoke = (messageId: string) => {
    if (socket && conversation) {
      socket.emit('revokeMessage', { messageId, conversationId: conversation.id });
    }
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
          <Ionicons name="arrow-back" size={24} color="#334155" />
        </TouchableOpacity>
        <Image source={{ uri: chatAvatar }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{chatName}</Text>
          <Text style={styles.headerStatus}>
            {isPrivate
              ? (otherParticipant?.isOnline ? '● Đang hoạt động' : 'Ngoại tuyến')
              : `${conversation.participants.length} thành viên`}
          </Text>
        </View>
        <TouchableOpacity style={styles.infoBtn}>
          <Ionicons name="information-circle-outline" size={24} color="#64748b" />
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
            contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => {
              const isSelf = item.senderId === currentUser?.id;
              const sender = conversation.participants.find((p) => p.id === item.senderId);
              const nextMessage = invertedMessages[index + 1];
              const isConsecutive = nextMessage && nextMessage.senderId === item.senderId;

              return (
                <MessageBubble
                  message={item}
                  isSelf={isSelf}
                  sender={sender}
                  onReply={setReplyingTo}
                  onReact={handleReact}
                  onRevoke={handleRevoke}
                  showAvatar={!isSelf && !isConsecutive}
                />
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <View style={styles.emptyMsgIcon}>
                  <Ionicons name="chatbubbles-outline" size={36} color="#93c5fd" />
                </View>
                <Text style={styles.emptyMsgText}>Gửi lời chào để bắt đầu! 👋</Text>
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
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  emptyScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0' },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  headerStatus: { fontSize: 12, color: '#64748b', marginTop: 1 },
  infoBtn: { padding: 6, marginLeft: 8 },
  messageList: { flex: 1 },
  emptyMessages: { alignItems: 'center', paddingTop: 80 },
  emptyMsgIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyMsgText: { color: '#64748b', fontSize: 14 },
});
