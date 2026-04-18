import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message, User } from '../types';
import { format } from 'date-fns';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const getFileIcon = (fileName: string) => {
  if (fileName.endsWith('.pdf')) return '📄';
  if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return '📃';
  if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return '📊';
  if (fileName.endsWith('.zip')) return '🗜️';
  return '📎';
};

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  sender?: User;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRevoke?: (messageId: string) => void;
  showAvatar?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSelf,
  sender,
  onReply,
  onReact,
  onRevoke,
  showAvatar = true,
}) => {
  const [showActions, setShowActions] = useState(false);

  const isRevoked = message.isRevoked;

  const handleTap = () => {
    if (!isRevoked) setShowActions(true);
  };

  const handleReact = (emoji: string) => {
    onReact?.(message.id, emoji);
    setShowActions(false);
  };

  const groupedReactions = React.useMemo(() => {
    if (!message.reactions?.length) return [];
    const map = new Map<string, number>();
    message.reactions.forEach((r) => map.set(r.emoji, (map.get(r.emoji) || 0) + 1));
    return Array.from(map.entries()).map(([emoji, count]) => ({ emoji, count }));
  }, [message.reactions]);

  // Revoked message
  if (isRevoked) {
    return (
      <View style={[styles.row, isSelf ? styles.rowRight : styles.rowLeft]}>
        {!isSelf && <View style={styles.avatarSpacer} />}
        <View style={styles.revokedBubble}>
          <Ionicons name="ban-outline" size={12} color="#94a3b8" />
          <Text style={styles.revokedText}> Tin nhắn đã bị thu hồi</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.row, isSelf ? styles.rowRight : styles.rowLeft]}>
        {/* Avatar người khác */}
        {!isSelf && (
          showAvatar ? (
            <Image
              source={{ uri: sender?.avatarUrl || `https://i.pravatar.cc/150?u=${message.senderId}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarSpacer} />
          )
        )}

        <View style={[styles.bubble, isSelf ? styles.bubbleRight : styles.bubbleLeft]}>
          {/* Sender name */}
          {!isSelf && showAvatar && (
            <Text style={styles.senderName}>{sender?.name || 'Người dùng'}</Text>
          )}

          {/* Reply preview */}
          {message.replyTo && (
            <View style={[styles.replyBox, isSelf ? styles.replyBoxSelf : styles.replyBoxOther]}>
              <Text style={styles.replyLabel}>↩ Đã trả lời</Text>
              <Text
                style={[styles.replyContent, isSelf ? styles.replyContentSelf : styles.replyContentOther]}
                numberOfLines={1}
              >
                {message.replyTo.isRevoked ? 'Tin nhắn đã bị thu hồi' : message.replyTo.content}
              </Text>
            </View>
          )}

          {/* Bubble content - nhấn để hiện emoji */}
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={handleTap}
            onLongPress={() => setShowActions(true)}
            style={[styles.content, isSelf ? styles.contentSelf : styles.contentOther]}
          >
            {message.content ? (
              <Text style={[styles.text, isSelf ? styles.textSelf : styles.textOther]}>
                {message.content}
              </Text>
            ) : null}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <View style={{ marginTop: message.content ? 8 : 0 }}>
                {message.attachments.map((file, idx) => {
                  const isImg = file.fileType?.startsWith('image/');
                  return isImg ? (
                    <TouchableOpacity key={idx} onPress={() => Linking.openURL(file.url)}>
                      <Image source={{ uri: file.url }} style={styles.imageAttachment} resizeMode="cover" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.fileAttachment, isSelf ? styles.fileAttachSelf : styles.fileAttachOther]}
                      onPress={() => Linking.openURL(file.url)}
                    >
                      <Text style={styles.fileIcon}>{getFileIcon(file.fileName)}</Text>
                      <Text style={[styles.fileName, isSelf ? styles.fileNameSelf : styles.fileNameOther]} numberOfLines={1}>
                        {file.fileName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </TouchableOpacity>

          {/* Reactions display */}
          {groupedReactions.length > 0 && (
            <View style={[styles.reactionsRow, isSelf ? styles.reactionsRowRight : styles.reactionsRowLeft]}>
              {groupedReactions.map(({ emoji, count }) => (
                <View key={emoji} style={styles.reactionChip}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Time */}
          <Text style={[styles.time, isSelf ? styles.timeRight : styles.timeLeft]}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </Text>
        </View>
      </View>

      {/* Actions overlay: quick emoji + reply + revoke */}
      <Modal
        transparent
        visible={showActions}
        animationType="fade"
        onRequestClose={() => setShowActions(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowActions(false)}>
          <View style={styles.actionsCard}>
            {/* Quick emoji bar */}
            <View style={styles.quickEmojiRow}>
              {QUICK_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.quickEmojiBtn}
                  onPress={() => handleReact(emoji)}
                >
                  <Text style={styles.quickEmojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            {/* Reply (cả 2 chiều) */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onReply?.(message);
                setShowActions(false);
              }}
            >
              <Ionicons name="arrow-undo-outline" size={18} color="#334155" />
              <Text style={styles.menuText}>Trả lời</Text>
            </TouchableOpacity>

            {/* Revoke (chỉ tin của mình) */}
            {isSelf && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onRevoke?.(message.id);
                    setShowActions(false);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                  <Text style={[styles.menuText, { color: '#dc2626' }]}>Thu hồi tin nhắn</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },

  avatar: { width: 30, height: 30, borderRadius: 15, marginRight: 6 },
  avatarSpacer: { width: 30, marginRight: 6 },

  bubble: { maxWidth: '78%' },
  bubbleLeft: { alignItems: 'flex-start' },
  bubbleRight: { alignItems: 'flex-end' },

  senderName: { fontSize: 11, color: '#64748b', marginBottom: 3, marginLeft: 4 },

  replyBox: {
    padding: 7, borderRadius: 8, borderLeftWidth: 3, marginBottom: 4,
  },
  replyBoxSelf: { backgroundColor: 'rgba(37,99,235,0.18)', borderLeftColor: '#93c5fd' },
  replyBoxOther: { backgroundColor: 'rgba(148,163,184,0.15)', borderLeftColor: '#94a3b8' },
  replyLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', marginBottom: 1 },
  replyContent: { fontSize: 12 },
  replyContentSelf: { color: '#bfdbfe' },
  replyContentOther: { color: '#475569' },

  content: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  contentSelf: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  contentOther: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },

  text: { fontSize: 15, lineHeight: 22 },
  textSelf: { color: '#ffffff' },
  textOther: { color: '#0f172a' },

  imageAttachment: { width: 200, height: 150, borderRadius: 10, marginTop: 4 },
  fileAttachment: {
    flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, marginTop: 4,
  },
  fileAttachSelf: { backgroundColor: 'rgba(255,255,255,0.2)' },
  fileAttachOther: { backgroundColor: '#f1f5f9' },
  fileIcon: { fontSize: 16, marginRight: 6 },
  fileName: { fontSize: 13, fontWeight: '500', flex: 1 },
  fileNameSelf: { color: '#dbeafe' },
  fileNameOther: { color: '#334155' },

  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  reactionsRowLeft: { justifyContent: 'flex-start', marginLeft: 4 },
  reactionsRowRight: { justifyContent: 'flex-end', marginRight: 4 },
  reactionChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f1f5f9', borderRadius: 12,
    paddingHorizontal: 7, paddingVertical: 2,
    marginRight: 4, marginBottom: 2,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { fontSize: 11, color: '#475569', marginLeft: 2 },

  time: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
  timeLeft: { marginLeft: 4 },
  timeRight: { marginRight: 4 },

  revokedBubble: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 14, backgroundColor: '#f1f5f9',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  revokedText: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic' },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    width: 260,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
  },
  quickEmojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#fafafa',
  },
  quickEmojiBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  quickEmojiText: { fontSize: 26 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#e2e8f0' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  menuText: { fontSize: 15, color: '#334155', marginLeft: 12, fontWeight: '500' },
});
