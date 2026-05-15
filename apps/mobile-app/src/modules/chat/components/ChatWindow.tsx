import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Socket } from 'socket.io-client';
import { Conversation, Message, User, Attachment, Reaction } from '../types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ChatInfoSidebar } from './ChatInfoSidebar';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUser: User | null;
  currentUserId?: string;
  privatePeer?: User | null;
  onSendMessage: (text: string, attachments?: Attachment[], replyToId?: string) => Promise<void>;
  isLoadingMessages: boolean;
  isSending: boolean;
  onBack: () => void;
  socket: Socket | null;
  onForwardMessage?: (message: Message) => void;
  onOpenProfile?: (user: User) => void;
  onOpenGroupManage?: () => void;
  /** Gọi thoại 1-1 */
  onStartVoiceCall?: () => void;
  /** Gọi video 1-1 */
  onStartVideoCall?: () => void;
  /** Gọi nhóm SFU (group/class chat) */
  onStartGroupCall?: () => void;
  /** Trạng thái cuộc gọi đang diễn ra (để disable nút khi đang gọi) */
  isCallActive?: boolean;
  typingUsers?: Record<string, string>;
  onTyping?: (isTyping: boolean) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUser,
  currentUserId,
  privatePeer,
  onSendMessage,
  isLoadingMessages,
  isSending,
  onBack,
  socket,
  onForwardMessage,
  onOpenProfile,
  onOpenGroupManage,
  onStartVoiceCall,
  onStartVideoCall,
  onStartGroupCall,
  isCallActive = false,
  typingUsers = {},
  onTyping,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

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
          if (data.revokeType === 'self') return m;
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
  }, [socket, conversation, currentUser?.id]);

  const handleReact = (messageId: string, emoji: string) => {
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
    setLocalMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isRevoked: true } : m))
    );
    socket.emit('revokeForAll', { messageId, conversationId: conversation.id });
    socket.once('revokeError', (err: { messageId: string; error: string }) => {
      if (err.messageId === messageId) {
        setLocalMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isRevoked: false } : m))
        );
      }
    });
  };

  const handleRevokeForMe = (messageId: string) => {
    if (!socket || !conversation) return;
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
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="chatbubbles" size={36} color="#3b82f6" />
        </View>
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 16 }} />
      </View>
    );
  }

  const isPrivate = conversation.type === 'private';
  const selfId = currentUserId || currentUser?.id;
  const otherParticipant = isPrivate
    ? (privatePeer || conversation.participants.find((p) => p.id !== selfId) || null)
    : null;

  const chatName = isPrivate
    ? (otherParticipant?.name || 'Người dùng')
    : (conversation.name || conversation.participants.map((p) => p.name).join(', '));
  const chatAvatar = isPrivate
    ? (otherParticipant?.avatarUrl || `https://i.pravatar.cc/150?u=${otherParticipant?.id}`)
    : (conversation.avatarUrl || `https://i.pravatar.cc/150?img=30`);
  const headerUser = isPrivate ? otherParticipant || null : conversation.participants.find((p) => p.id === conversation.ownerId) || null;

  const invertedMessages = [...localMessages].reverse();

  const typingNames = Object.values(typingUsers);
  const typingText = typingNames.length > 0
    ? `${typingNames.length > 1 ? `${typingNames.length} người` : typingNames[0]} đang soạn tin nhắn`
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerAvatarWrap}
          activeOpacity={0.85}
          onPress={() => setIsSidebarVisible(true)}
        >
          <Image source={{ uri: chatAvatar }} style={styles.headerAvatar} />
          {isPrivate && otherParticipant?.isOnline && (
            <View style={styles.onlineStatus} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfo}
          activeOpacity={0.7}
          onPress={() => setIsSidebarVisible(true)}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chatName}
          </Text>
          <Text style={[
            styles.headerSub,
            isPrivate && otherParticipant?.isOnline && styles.headerSubOnline
          ]}>
            {isPrivate
              ? otherParticipant?.isOnline
                ? '● Đang hoạt động'
                : 'Ngoại tuyến'
              : `${conversation?.participants?.length || 0} thành viên`}
          </Text>
        </TouchableOpacity>

        {/* Nút gọi thoại 1-1 */}
        {isPrivate && (
          <TouchableOpacity
            style={[
              styles.callBtn,
              isCallActive && styles.callBtnActive,
              !onStartVoiceCall && styles.callBtnDimmed,
            ]}
            onPress={onStartVoiceCall}
            disabled={isCallActive || !onStartVoiceCall}
          >
            <Ionicons
              name={isCallActive ? 'call' : 'call-outline'}
              size={20}
              color={isCallActive ? '#22C55E' : '#3B82F6'}
            />
          </TouchableOpacity>
        )}

        {/* Nút gọi video 1-1 */}
        {isPrivate && (
          <TouchableOpacity
            style={[
              styles.callBtn,
              isCallActive && styles.callBtnActive,
              !onStartVideoCall && styles.callBtnDimmed,
            ]}
            onPress={onStartVideoCall}
            disabled={isCallActive || !onStartVideoCall}
          >
            <Ionicons
              name={isCallActive ? 'videocam' : 'videocam-outline'}
              size={22}
              color={isCallActive ? '#22C55E' : '#3B82F6'}
            />
          </TouchableOpacity>
        )}

        {/* Nút gọi nhóm – luôn hiện trong group/class chat */}
        {!isPrivate && (
          <TouchableOpacity
            style={[
              styles.callBtn,
              isCallActive && styles.callBtnActive,
              !onStartGroupCall && styles.callBtnDimmed,
            ]}
            onPress={onStartGroupCall}
            disabled={isCallActive || !onStartGroupCall}
          >
            <Ionicons
              name={isCallActive ? 'videocam' : 'videocam-outline'}
              size={22}
              color={isCallActive ? '#22C55E' : '#3B82F6'}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setIsSidebarVisible(true)}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <View style={styles.messagesList}>
        {isLoadingMessages ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={invertedMessages}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => {
              const isSelf = item.senderId === currentUser?.id;
              const sender = conversation.participants.find((p) => p.id === item.senderId);
              const nextMessage = invertedMessages[index + 1];
              const isConsecutive = nextMessage && nextMessage.senderId === item.senderId;

              return (
                <View>
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
                </View>
              );
            }}
            ListEmptyComponent={() => (
              <View style={styles.listEmpty}>
                <View style={styles.emptyStateIconWrap}>
                  <Ionicons name="chatbubbles-outline" size={32} color="#93c5fd" />
                </View>
                <Text style={styles.emptyStateTitle}>Chưa có tin nhắn</Text>
                <Text style={styles.emptyStateSub}>Gửi lời chào để bắt đầu trò chuyện 👋</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Typing Indicator Bar */}
      {typingText && (
        <View style={styles.typingIndicatorBar}>
          <Text style={styles.typingText}>
            {typingText}
            <Text style={styles.typingDots}> ● ●</Text>
          </Text>
        </View>
      )}

      {/* Input */}
      <MessageInput
        onSend={onSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={isLoadingMessages}
        onTyping={onTyping}
      />

      {/* Sidebar */}
      <ChatInfoSidebar
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        conversationId={conversation.id}
        currentChatUserId={currentUser?.id}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 10,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  headerAvatarWrap: { position: 'relative', marginRight: 10 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0' },
  onlineStatus: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFF',
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  headerSub: { fontSize: 11, marginTop: 2, color: '#94A3B8' },
  headerSubOnline: { color: '#22C55E', fontWeight: '600' },
  messagesList: { flex: 1 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 4, paddingVertical: 12 },
  listEmpty: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 40, transform: [{ scaleY: -1 }] },
  emptyStateIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyStateTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 6 },
  emptyStateSub: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  typingIndicatorBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
  },
  callBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 2,
  },
  callBtnActive: {
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  callBtnDimmed: {
    opacity: 0.35,
  },
  messageList: { flex: 1 },
  emptyMessages: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyMsgIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  typingText: {
    fontSize: 13,
    color: '#4F46E5', // Indigo/Blue matching the image
    fontWeight: '500',
  },
  typingDots: {
    color: '#818CF8',
    fontSize: 14,
  },
});
