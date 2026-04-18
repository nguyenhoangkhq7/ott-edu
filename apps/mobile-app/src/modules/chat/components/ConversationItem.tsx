import React from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation, User } from '../types';
import { format, isToday, isYesterday } from 'date-fns';

interface ConversationItemProps {
  conversation: Conversation;
  currentUser: User | null;
  isActive: boolean;
  onSelect: (id: string) => void;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Hôm qua';
  return format(d, 'dd/MM');
};

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation, currentUser, isActive, onSelect,
}) => {
  const isPrivate = conversation.type === 'private';
  const other = isPrivate
    ? conversation.participants.find((p) => p.id !== currentUser?.id)
    : null;

  const displayName = conversation.name ||
    (isPrivate ? other?.name || 'Người dùng ẩn'
      : conversation.participants.map((p) => p.name).join(', '));

  const avatarUri = conversation.avatarUrl ||
    (isPrivate
      ? other?.avatarUrl || `https://i.pravatar.cc/150?u=${other?.id}`
      : `https://i.pravatar.cc/150?img=30`);

  const lastMsg = conversation.lastMessage;
  const isMe = lastMsg?.senderId === currentUser?.id;
  const preview = !lastMsg
    ? 'Chưa có tin nhắn'
    : lastMsg.isRevoked
      ? '🚫 Tin nhắn đã thu hồi'
      : lastMsg.revokedFor?.includes('__self__') || (lastMsg.revokedFor && currentUser?.id && lastMsg.revokedFor.includes(currentUser.id))
        ? (isMe ? 'Bạn: ' : '') + 'Tin nhắn đã ẩn'
        : lastMsg.attachments?.length
          ? '📎 Tệp đính kèm'
          : isMe ? `Bạn: ${lastMsg.content}` : lastMsg.content;

  const hasUnread = conversation.unreadCount > 0;

  return (
    <TouchableOpacity
      style={[styles.item, isActive && styles.itemActive]}
      onPress={() => onSelect(conversation.id)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        {isPrivate && other?.isOnline && <View style={styles.onlineDot} />}
        {!isPrivate && (
          <View style={styles.groupBadge}>
            <Ionicons name="people" size={8} color="#fff" />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, hasUnread && styles.nameUnread]} numberOfLines={1}>
            {displayName}
          </Text>
          {lastMsg && (
            <Text style={[styles.time, hasUnread && styles.timeUnread]}>
              {formatTime(lastMsg.createdAt)}
            </Text>
          )}
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[styles.preview, hasUnread && styles.previewUnread]}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {hasUnread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  itemActive: {
    backgroundColor: '#EFF6FF',
  },
  avatarWrap: { position: 'relative', marginRight: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  groupBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, minWidth: 0 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    marginRight: 8,
  },
  nameUnread: { fontWeight: '700', color: '#0F172A' },
  time: { fontSize: 12, color: '#94A3B8' },
  timeUnread: { color: '#3B82F6', fontWeight: '600' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview: {
    flex: 1,
    fontSize: 13,
    color: '#94A3B8',
    marginRight: 8,
  },
  previewUnread: { color: '#475569', fontWeight: '500' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
});
