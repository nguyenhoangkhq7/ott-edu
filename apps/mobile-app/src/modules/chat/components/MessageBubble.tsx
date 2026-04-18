import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, Linking,
  StyleSheet, Modal, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message, User } from '../types';
import { format } from 'date-fns';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];
const REVOKE_FOR_ALL_LIMIT_MS = 15 * 60 * 1000;

const getFileIcon = (fileName: string) => {
  if (fileName.endsWith('.pdf')) return '📄';
  if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return '📝';
  if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return '📊';
  if (fileName.endsWith('.zip') || fileName.endsWith('.rar')) return '🗜️';
  return '📎';
};

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  currentUserId?: string;
  sender?: User;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRevokeForAll?: (messageId: string) => void;
  onRevokeForMe?: (messageId: string) => void;
  onForward?: (message: Message) => void;
  showAvatar?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message, isSelf, currentUserId, sender, onReply, onReact,
  onRevokeForAll, onRevokeForMe, onForward, showAvatar = true,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isRevoked = message.isRevoked;
  const isSelfRevoked =
    message.revokedFor?.includes('__self__') ||
    (currentUserId != null && message.revokedFor?.includes(currentUserId));

  // Time limit check
  const ageMs = Date.now() - new Date(message.createdAt).getTime();
  const canRevokeForAll = isSelf && ageMs <= REVOKE_FOR_ALL_LIMIT_MS;
  const remainingMinutes = Math.max(0, Math.ceil((REVOKE_FOR_ALL_LIMIT_MS - ageMs) / 60000));

  const grouped = React.useMemo(() => {
    if (!message.reactions?.length) return [];
    const map = new Map<string, number>();
    message.reactions.forEach((r) => map.set(r.emoji, (map.get(r.emoji) || 0) + 1));
    return Array.from(map.entries()).map(([emoji, count]) => ({ emoji, count }));
  }, [message.reactions]);

  // Mất hoàn toàn khỏi giao diện nếu user chọn "Ẩn với chỉ mình tôi" 
  // (Messenger/Zalo -> Xóa ở phía tôi là biến mất hoàn toàn)
  if (isSelfRevoked) {
    return null;
  }

  // Thu hồi chung với mọi người (Unsend for everyone) -> Hiện "Tin nhắn đã bị thu hồi"
  if (isRevoked) {
    return (
      <View style={[styles.row, isSelf ? styles.rowSelf : styles.rowOther]}>
        {!isSelf && <View style={styles.avatarSpace} />}
        <View style={[styles.revokedChip, isSelf ? styles.revokedSelf : styles.revokedOther]}>
          <Ionicons name="trash-outline" size={11} color="#94A3B8" />
          <Text style={styles.revokedTxt}> Tin nhắn đã bị thu hồi</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.row, isSelf ? styles.rowSelf : styles.rowOther]}>
        {/* Avatar */}
        {!isSelf && (
          showAvatar ? (
            <Image
              source={{ uri: sender?.avatarUrl || `https://i.pravatar.cc/150?u=${message.senderId}` }}
              style={styles.avatar}
            />
          ) : <View style={styles.avatarSpace} />
        )}

        <View style={[styles.group, isSelf ? styles.groupSelf : styles.groupOther]}>
          {/* Sender name (group chat) */}
          {!isSelf && showAvatar && sender?.name && (
            <Text style={styles.senderName}>{sender.name}</Text>
          )}

          {/* Reply quote */}
          {message.replyTo && (
            <View style={[styles.quote, isSelf ? styles.quoteSelf : styles.quoteOther]}>
              <Text style={[styles.quoteLabel, isSelf ? styles.quoteLabelSelf : styles.quoteLabelOther]}>
                ↩ Đã trả lời
              </Text>
              <Text
                style={[styles.quoteText, isSelf ? styles.quoteTextSelf : styles.quoteTextOther]}
                numberOfLines={1}
              >
                {message.replyTo.isRevoked ? '🚫 Tin nhắn đã thu hồi' : message.replyTo.content}
              </Text>
            </View>
          )}

          {message.isForwarded && (
            <View style={[styles.forwardWrapper, isSelf ? { alignItems: 'flex-end', paddingRight: 4 } : { alignItems: 'flex-start', paddingLeft: 4 }]}>
              <Ionicons name="arrow-redo-outline" size={12} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.forwardTxt}>Tin nhắn chuyển tiếp</Text>
            </View>
          )}

          {/* Bubble */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowMenu(true)}
            style={[styles.bubble, isSelf ? styles.bubbleSelf : styles.bubbleOther]}
          >
            {/* Text */}
            {!!message.content && (
              <Text style={[styles.text, isSelf ? styles.textSelf : styles.textOther]}>
                {message.content}
              </Text>
            )}

            {/* Attachments */}
            {message.attachments?.map((file, i) => {
              const isImg = file.fileType?.startsWith('image/');
              return isImg ? (
                <TouchableOpacity key={i} onPress={() => Linking.openURL(file.url)} style={{ marginTop: message.content ? 6 : 0 }}>
                  <Image source={{ uri: file.url }} style={styles.imgAttachment} resizeMode="cover" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  key={i}
                  style={[styles.fileRow, isSelf ? styles.fileRowSelf : styles.fileRowOther]}
                  onPress={() => Linking.openURL(file.url)}
                >
                  <Text style={styles.fileIconTxt}>{getFileIcon(file.fileName)}</Text>
                  <Text
                    style={[styles.fileNameTxt, isSelf ? styles.fileNameSelf : styles.fileNameOther]}
                    numberOfLines={1}
                  >
                    {file.fileName}
                  </Text>
                  <Ionicons name="download-outline" size={14} color={isSelf ? '#BFDBFE' : '#64748B'} />
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>

          {/* Reactions chips */}
          {grouped.length > 0 && (
            <View style={[styles.reactRow, isSelf ? styles.reactRowSelf : styles.reactRowOther]}>
              {grouped.map(({ emoji, count }) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactChip}
                  onPress={() => onReact?.(message.id, emoji)}
                >
                  <Text style={styles.reactEmoji}>{emoji}</Text>
                  {count > 1 && <Text style={styles.reactCount}>{count}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Timestamp */}
          <Text style={[styles.ts, isSelf ? styles.tsSelf : styles.tsOther]}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </Text>
        </View>
      </View>

      {/* Action menu */}
      <Modal transparent visible={showMenu} animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowMenu(false)}>
          <Pressable style={styles.menuCard}>
            {/* Quick emoji bar */}
            <View style={styles.emojiBar}>
              {QUICK_EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={styles.emojiTile}
                  onPress={() => { onReact?.(message.id, e); setShowMenu(false); }}
                >
                  <Text style={styles.emojiTxt}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.hr} />

            {/* Divider + Reply */}
            <View style={styles.hr} />
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => { onReply?.(message); setShowMenu(false); }}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="arrow-undo" size={16} color="#3B82F6" />
              </View>
              <Text style={styles.menuTxt}>Trả lời</Text>
            </TouchableOpacity>

            <View style={styles.hr} />
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => { onForward?.(message); setShowMenu(false); }}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#F8FAFC' }]}>
                <Ionicons name="arrow-redo" size={16} color="#64748B" />
              </View>
              <Text style={styles.menuTxt}>Chuyển tiếp</Text>
            </TouchableOpacity>

            {/* Thu hồi với tất cả - chỉ trong 15 phút */}
            {isSelf && (
              <>
                <View style={styles.hr} />
                <TouchableOpacity
                  style={[styles.menuRow, !canRevokeForAll && styles.menuRowDisabled]}
                  onPress={() => {
                    if (!canRevokeForAll) return;
                    onRevokeForAll?.(message.id);
                    setShowMenu(false);
                  }}
                  disabled={!canRevokeForAll}
                >
                  <View style={[styles.menuIcon, { backgroundColor: canRevokeForAll ? '#FFF1F2' : '#F8FAFC' }]}>
                    <Ionicons name="trash" size={16} color={canRevokeForAll ? '#EF4444' : '#94A3B8'} />
                  </View>
                  <View>
                    <Text style={[styles.menuTxt, { color: canRevokeForAll ? '#EF4444' : '#94A3B8' }]}>
                      Thu hồi với mọi người
                    </Text>
                    <Text style={styles.menuSubTxt}>
                      {canRevokeForAll ? `Còn ${remainingMinutes} phút` : 'Đã quá 15 phút'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* Thu hồi về phía mình - không giới hạn */}
            <View style={styles.hr} />
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => { onRevokeForMe?.(message.id); setShowMenu(false); }}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#F8FAFC' }]}>
                <Ionicons name="eye-off-outline" size={16} color="#64748B" />
              </View>
              <Text style={styles.menuTxt}>Ẩn với chỉ mình tôi</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 2,
    paddingHorizontal: 12,
  },
  rowSelf: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },

  avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, marginBottom: 4 },
  avatarSpace: { width: 28, marginRight: 8 },

  group: { maxWidth: '76%' },
  groupSelf: { alignItems: 'flex-end' },
  groupOther: { alignItems: 'flex-start' },

  senderName: {
    fontSize: 11, fontWeight: '600', color: '#64748B',
    marginBottom: 2, marginLeft: 2,
  },

  // Reply quote
  quote: {
    borderRadius: 8,
    borderLeftWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 4,
    maxWidth: '100%',
  },
  quoteSelf: { backgroundColor: 'rgba(37,99,235,0.12)', borderLeftColor: '#93C5FD' },
  quoteOther: { backgroundColor: '#F1F5F9', borderLeftColor: '#CBD5E1' },
  quoteLabel: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  quoteLabelSelf: { color: '#93C5FD' },
  quoteLabelOther: { color: '#64748B' },
  quoteText: { fontSize: 12 },
  quoteTextSelf: { color: '#DBEAFE' },
  quoteTextOther: { color: '#475569' },

  // Bubble
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  bubbleSelf: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 5,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  text: { fontSize: 15, lineHeight: 22 },
  textSelf: { color: '#FFFFFF' },
  textOther: { color: '#0F172A' },

  // Attachments
  imgAttachment: { width: 200, height: 150, borderRadius: 10 },
  fileRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    marginTop: 6,
  },
  fileRowSelf: { backgroundColor: 'rgba(255,255,255,0.15)' },
  fileRowOther: { backgroundColor: '#F8FAFC' },
  fileIconTxt: { fontSize: 18, marginRight: 8 },
  fileNameTxt: { fontSize: 13, fontWeight: '500', flex: 1, marginRight: 6 },
  fileNameSelf: { color: '#DBEAFE' },
  fileNameOther: { color: '#334155' },

  // Reactions
  reactRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  reactRowSelf: { justifyContent: 'flex-end' },
  reactRowOther: { justifyContent: 'flex-start' },
  reactChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
    marginRight: 4, marginBottom: 2,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  reactEmoji: { fontSize: 13 },
  reactCount: { fontSize: 11, color: '#64748B', marginLeft: 3, fontWeight: '600' },

  // Timestamp
  ts: { fontSize: 10, color: '#94A3B8', marginTop: 3 },
  tsSelf: { marginRight: 2 },
  tsOther: { marginLeft: 2 },

  // Forward indicator
  forwardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  forwardTxt: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },

  // Revoked
  revokedChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 14,
  },
  revokedSelf: { backgroundColor: '#F1F5F9', alignSelf: 'flex-end' },
  revokedOther: { backgroundColor: '#F1F5F9' },
  revokedTxt: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },

  // Menu modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  menuCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20,
    width: 280, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 20,
  },
  emojiBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: '#FAFAFA',
  },
  emojiTile: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  emojiTxt: { fontSize: 24 },
  hr: { height: StyleSheet.hairlineWidth, backgroundColor: '#F1F5F9' },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  menuRowDisabled: { opacity: 0.7 },
  menuIcon: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  menuTxt: { fontSize: 15, fontWeight: '500', color: '#1E293B' },
  menuSubTxt: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
});
