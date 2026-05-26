import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  View, Text, TouchableOpacity, Image, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Socket } from 'socket.io-client';
import { CallHistoryItem, Conversation, Message, User, Attachment, Reaction } from '../types';
import type { MediaCallKind } from '../types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ChatInfoSidebar } from './ChatInfoSidebar';
import AddMemberModal from './AddMemberModal';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUser: User | null;
  currentUserId?: string;
  privatePeer?: User | null;
  onSendMessage: (
    text: string,
    attachments?: Attachment[],
    replyToId?: string,
  ) => Promise<void>;
  isLoadingMessages: boolean;
  isSending: boolean;
  callHistory?: CallHistoryItem[];
  isLoadingCallHistory?: boolean;
  callHistoryPage?: number;
  callHistoryTotalPages?: number;
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
  onStartGroupCall?: (callType?: MediaCallKind) => void;
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
  callHistory = [],
  isLoadingCallHistory: _isLoadingCallHistory = false,
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
  const isLoadingTimeline = isLoadingMessages || _isLoadingCallHistory;

  const formatCallStatus = (item: CallHistoryItem): string => {
    switch (item.status) {
      case "connected":
      case "ended":
        return "Đã gọi";
      case "declined":
        return "Bị từ chối";
      case "unavailable":
        return "Không liên lạc được";
      case "failed":
        return "Lỗi kết nối";
      case "ringing":
        return "Đang đổ chuông";
      default:
        return item.status;
    }
  };

  // 🚀 STATE ĐIỀU KHIỂN MODAL THÊM NGƯỜI CỦA BẠN
  const [showAddMember, setShowAddMember] = useState(false);

  // 🚀 KHAI BÁO IDENTITY (Fix lỗi "Cannot find name 'identity'")
  const identity = useMemo(() => {
    if (!currentUser?.email) return null;
    return {
      email: currentUser.email,
      code: currentUser.code || "",
      // Lấy ID MongoDB (chuỗi dài) để đồng bộ với Chat Service
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: (currentUser as any)?._id || currentUser?.id || "",
    };
  }, [currentUser]);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (!socket || !conversation) return;

    const handleReacted = (data: {
      messageId: string;
      reactions: Reaction[];
    }) => {
      setLocalMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, reactions: data.reactions } : m,
        ),
      );
    };

    const handleRevoked = (data: {
      messageId: string;
      revokeType?: string;
      isRevoked?: boolean;
    }) => {
      setLocalMessages((prev) =>
        prev.map((m) => {
          if (m.id !== data.messageId) return m;
          if (data.revokeType === "self") return m;
          return { ...m, isRevoked: true };
        }),
      );
    };

    socket.on("messageReacted", handleReacted);
    socket.on("messageRevoked", handleRevoked);

    return () => {
      socket.off("messageReacted", handleReacted);
      socket.off("messageRevoked", handleRevoked);
    };
  }, [socket, conversation, currentUser?.id]);

  const handleReact = (messageId: string, emoji: string) => {
    setLocalMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions || [];
        const hasMyReaction = existing.some(
          (r) => r.emoji === emoji && r.userId === (currentUser?.id || ""),
        );
        const updated = hasMyReaction
          ? existing.filter(
              (r) =>
                !(r.emoji === emoji && r.userId === (currentUser?.id || "")),
            )
          : [...existing, { emoji, userId: currentUser?.id || "" }];
        return { ...m, reactions: updated };
      }),
    );
    if (socket && conversation) {
      socket.emit("reactMessage", {
        messageId,
        conversationId: conversation.id,
        emoji,
      });
    }
  };

  const handleRevokeForAll = (messageId: string) => {
    if (!socket || !conversation) return;
    setLocalMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isRevoked: true } : m)),
    );
    socket.emit("revokeForAll", { messageId, conversationId: conversation.id });
    socket.once("revokeError", (err: { messageId: string; error: string }) => {
      if (err.messageId === messageId) {
        setLocalMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, isRevoked: false } : m,
          ),
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
            ? { ...m, revokedFor: [...(m.revokedFor || []), currentUser!.id] }
            : m,
        ),
      );
    }
    socket.emit("revokeForMe", { messageId, conversationId: conversation.id });
  };

  if (!conversation) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="chatbubbles" size={36} color="#3b82f6" />
        </View>
        <ActivityIndicator
          size="large"
          color="#3b82f6"
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  const isPrivate = conversation.type === "private";
  const selfId = currentUserId || currentUser?.id;
  const otherParticipant = isPrivate
    ? privatePeer || conversation.participants.find((p) => p.id !== selfId) || null
    : null;

  const chatName = isPrivate
    ? otherParticipant?.name || "Người dùng"
    : conversation.name || conversation.participants.map((p) => p.name).join(", ");
    
  const chatAvatar = isPrivate
    ? otherParticipant?.avatarUrl || `https://i.pravatar.cc/150?u=${otherParticipant?.id}`
    : conversation.avatarUrl || `https://i.pravatar.cc/150?img=30`;

  const isOwner = conversation?.ownerId === selfId || conversation?.myRole === 'owner';
  const isDeputy = conversation?.deputyId === selfId;
  const isAdmin = isOwner || isDeputy;
  const isReadOnly = conversation?.type === 'class' && !!conversation?.onlyAdminCanMessage && !isAdmin;

  const callHistoryMessages = React.useMemo(
    () =>
      callHistory.map((item) => ({
        id: item._id,
        conversationId: item.conversationId,
        senderId: item.callerId,
        content: `[call_log] ${JSON.stringify({
          callType: item.callType || "video",
          status: item.status,
          durationSec: item.durationSec,
          label: `Cuộc gọi ${formatCallStatus(item).toLowerCase()}`,
        })}`,
        createdAt: item.startedAt,
        status: "sent" as const,
        attachments: [],
        linkPreview: undefined,
        replyTo: null,
        isRevoked: false,
        revokedFor: [],
        isForwarded: false,
        reactions: [],
      })),
    [callHistory],
  );

  const timelineMessages = React.useMemo(() => {
    const combined = [...localMessages, ...callHistoryMessages];
    return combined.sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  }, [callHistoryMessages, localMessages]);

  const invertedMessages = [...timelineMessages].reverse();

  const typingNames = Object.values(typingUsers);
  const typingText = typingNames.length > 0
    ? `${typingNames.length > 1 ? `${typingNames.length} người` : typingNames[0]} đang soạn tin nhắn`
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
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
          <Text
            style={[
              styles.headerSub,
              isPrivate && otherParticipant?.isOnline && styles.headerSubOnline,
            ]}
          >
            {isPrivate
              ? otherParticipant?.isOnline
                ? "● Đang hoạt động"
                : "Ngoại tuyến"
              : `${conversation?.participants?.length || 0} thành viên`}
          </Text>
        </TouchableOpacity>

        {/* 🚀 NÚT THÊM THÀNH VIÊN (Chỉ hiện khi là Chat Nhóm) */}
        {!isPrivate && (
          <TouchableOpacity
            style={styles.infoBtn}
            onPress={() => setShowAddMember(true)}
          >
            <Ionicons name="person-add" size={22} color="#10B981" />
          </TouchableOpacity>
        )}

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
              name={isCallActive ? "call" : "call-outline"}
              size={20}
              color={isCallActive ? "#22C55E" : "#3B82F6"}
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
              name={isCallActive ? "videocam" : "videocam-outline"}
              size={22}
              color={isCallActive ? "#22C55E" : "#3B82F6"}
            />
          </TouchableOpacity>
        )}

        {/* Nút gọi nhóm – luôn hiện trong group/class chat */}
        {!isPrivate && (
          <>
            <TouchableOpacity
              style={[
                styles.callBtn,
                isCallActive && styles.callBtnActive,
                !onStartGroupCall && styles.callBtnDimmed,
              ]}
              onPress={() => onStartGroupCall?.('audio')}
              disabled={isCallActive || !onStartGroupCall}
            >
              <Ionicons
                name={isCallActive ? 'call' : 'call-outline'}
                size={20}
                color={isCallActive ? '#22C55E' : '#3B82F6'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.callBtn,
                isCallActive && styles.callBtnActive,
                !onStartGroupCall && styles.callBtnDimmed,
              ]}
              onPress={() => onStartGroupCall?.('video')}
              disabled={isCallActive || !onStartGroupCall}
            >
              <Ionicons
                name={isCallActive ? 'videocam' : 'videocam-outline'}
                size={22}
                color={isCallActive ? '#22C55E' : '#3B82F6'}
              />
            </TouchableOpacity>
          </>
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
        {isLoadingTimeline ? (
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
              const sender = conversation.participants.find(
                (p) => p.id === item.senderId,
              );
              const nextMessage = invertedMessages[index + 1];
              const isConsecutive =
                nextMessage && nextMessage.senderId === item.senderId;

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
                    onStartVoiceCall={onStartVoiceCall}
                    onStartVideoCall={onStartVideoCall}
                  />
                  {!isConsecutive && <View style={{ height: 6 }} />}
                </View>
              );
            }}
            ListEmptyComponent={() => (
              <View style={styles.listEmpty}>
                <View style={styles.emptyStateIconWrap}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={38}
                    color="#93C5FD"
                  />
                </View>
                <Text style={styles.emptyStateTitle}>Chưa có tin nhắn</Text>
                <Text style={styles.emptyStateSub}>
                  Gửi lời chào để bắt đầu trò chuyện 👋
                </Text>
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
        isReadOnly={isReadOnly}
      />

      {/* Sidebar */}
      <ChatInfoSidebar
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        conversationId={conversation.id}
        currentChatUserId={currentUser?.id}
        socket={socket}
      />

      {/* 🚀 RENDER MODAL THÊM THÀNH VIÊN CỦA BẠN */}
      {showAddMember && identity && (
        <AddMemberModal
          visible={showAddMember}
          onClose={() => setShowAddMember(false)}
          conversationId={conversation.id}
          identity={identity}
        />
      )}
    </KeyboardAvoidingView>
  );
};

// 🚀 MERGE TẤT CẢ STYLES CỦA CẢ 2 BÊN VÀO MỘT
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarWrap: { position: "relative", marginRight: 10 },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E2E8F0",
  },
  onlineStatus: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  headerInfo: { flex: 1 },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  headerSub: { fontSize: 12, color: "#94A3B8", marginTop: 1 },
  headerSubOnline: { color: "#22C55E", fontWeight: "600" },
  infoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
  callBtnActive: {
    backgroundColor: "rgba(34,197,94,0.12)",
  },
  callBtnDimmed: {
    opacity: 0.35,
  },
  messagesList: { flex: 1 },
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingVertical: 10, paddingHorizontal: 12 },
  listEmpty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyStateIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyStateTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  emptyStateSub: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  typingIndicatorBar: { paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#F8FAFC' },
  typingText: {
    fontSize: 13,
    color: "#4F46E5",
    fontWeight: "500",
  },
  typingDots: {
    color: "#818CF8",
    fontSize: 14,
  },
});