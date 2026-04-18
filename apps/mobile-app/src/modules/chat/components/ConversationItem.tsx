import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation, User } from '../types';
import { format } from 'date-fns';

interface ConversationItemProps {
  conversation: Conversation;
  currentUser: User | null;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  currentUser,
  isActive,
  onSelect,
}) => {
  const isPrivate = conversation.type === 'private';
  const otherParticipant = isPrivate
    ? conversation.participants.find((p) => p.id !== currentUser?.id)
    : null;

  const displayName =
    conversation.name ||
    (isPrivate
      ? otherParticipant?.name || 'Người dùng ẩn'
      : conversation.participants.map((p) => p.name).join(', '));

  const avatarUrl =
    conversation.avatarUrl ||
    (isPrivate
      ? otherParticipant?.avatarUrl || `https://i.pravatar.cc/150?u=${otherParticipant?.id || 'unknown'}`
      : `https://i.pravatar.cc/150?img=30`);

  const displayLastMessage = () => {
    if (!conversation.lastMessage) return 'Chưa có tin nhắn';
    const isMe = conversation.lastMessage.senderId === currentUser?.id;
    let text = conversation.lastMessage.content;
    if (conversation.lastMessage.isRevoked) {
      text = 'Tin nhắn đã thu hồi';
    } else if (conversation.lastMessage.attachments?.length) {
      text = 'Đã gửi một tệp đính kèm';
    }
    return isMe ? `Bạn: ${text}` : text;
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={() => onSelect(conversation.id)}
    >
      <View style={styles.avatarWrapper}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
        )}
        {isPrivate && otherParticipant?.isOnline && (
          <View style={styles.onlineDot} />
        )}
        {!isPrivate && (
          <View style={styles.groupBadge}>
            <Ionicons name="people" size={9} color="#3b82f6" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          {conversation.lastMessage && (
            <Text style={styles.time}>
              {format(new Date(conversation.lastMessage.createdAt), 'HH:mm')}
            </Text>
          )}
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[styles.lastMessage, conversation.unreadCount > 0 && styles.unreadMessage]}
            numberOfLines={1}
          >
            {displayLastMessage()}
          </Text>
          {conversation.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{conversation.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  activeContainer: {
    backgroundColor: '#eff6ff',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 16,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    backgroundColor: '#22c55e',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  groupBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#94a3b8',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
    marginRight: 8,
  },
  unreadMessage: {
    color: '#1e293b',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#3b82f6',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
