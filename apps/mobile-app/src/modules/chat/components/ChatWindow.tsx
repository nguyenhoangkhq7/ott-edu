import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation, Message, User } from '../types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUser: User | null;
  onSendMessage: (text: string, files?: null, replyToId?: string) => Promise<void>;
  isLoadingMessages: boolean;
  isSending: boolean;
  onBack: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  isLoadingMessages,
  isSending,
  onBack,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const invertedMessages = [...messages].reverse();

  if (!conversation) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const isPrivate = conversation.type === 'private';
  const otherParticipant = isPrivate
    ? conversation.participants.find((p) => p.id !== currentUser?.id)
    : null;

  const chatName =
    conversation.name ||
    (isPrivate ? otherParticipant?.name : conversation.participants.map((p) => p.name).join(', '));

  const chatAvatar =
    conversation.avatarUrl ||
    (isPrivate
      ? otherParticipant?.avatarUrl || `https://i.pravatar.cc/150?u=${otherParticipant?.id}`
      : `https://i.pravatar.cc/150?img=30`);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.screen}>
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
                ? otherParticipant?.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'
                : `${conversation.participants.length} thành viên`}
            </Text>
          </View>

          <TouchableOpacity style={styles.infoBtn}>
            <Ionicons name="information-circle-outline" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <View style={styles.messageList}>
          {isLoadingMessages ? (
            <View style={styles.loadingScreen}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={invertedMessages}
              keyExtractor={(item) => item.id}
              inverted
              contentContainerStyle={{ padding: 12, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
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
                    showAvatar={!isSelf && !isConsecutive}
                  />
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyMessages}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="chatbubbles" size={32} color="#3b82f6" />
                  </View>
                  <Text style={styles.emptyText}>Gửi lời chào để bắt đầu trò chuyện</Text>
                </View>
              }
            />
          )}
        </View>

        {/* Input */}
        <MessageInput
          onSend={onSendMessage}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          disabled={isLoadingMessages}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerStatus: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  infoBtn: {
    padding: 6,
    marginLeft: 8,
  },
  messageList: {
    flex: 1,
  },
  emptyMessages: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#dbeafe',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
});
