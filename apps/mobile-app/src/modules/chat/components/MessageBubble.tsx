import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Image, Linking,
  Modal, Pressable, Alert, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message, User, LinkPreview as LinkPreviewType } from '../types';
import { format } from 'date-fns';
import { useVideoPlayer, VideoView } from 'expo-video';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];
const REVOKE_FOR_ALL_LIMIT_MS = 15 * 60 * 1000;

const VideoMessageItem = ({ url }: { url: string }) => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return null; // LinkPreview handles YouTube links better
  }

  const player = useVideoPlayer(url, (player: any) => {
    player.loop = false;
  });

  return (
    <View style={styles.videoContainer}>
      <VideoView
        player={player}
        style={styles.videoView}
        contentFit="contain"
        allowsFullscreen
        allowsPictureInPicture
      />
      <TouchableOpacity 
        style={styles.videoOverlay} 
        onPress={() => Linking.openURL(url)}
      >
        <Ionicons name="open-outline" size={12} color="#FFF" style={{ marginRight: 4 }} />
        <Text style={styles.videoOverlayText}>Mở bằng trình duyệt</Text>
      </TouchableOpacity>
    </View>
  );
};

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
  onOpenProfile?: (user: User) => void;
  showAvatar?: boolean;
}

const LinkPreview = ({ preview }: { preview: LinkPreviewType }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => Linking.openURL(preview.url)}
      style={styles.linkPreviewContainer}
    >
      {preview.image && (
        <Image
          source={{ uri: preview.image }}
          style={styles.linkPreviewImage as any}
          resizeMode="cover"
        />
      )}
      <View style={styles.linkPreviewContent}>
        <Text style={styles.linkPreviewTitle} numberOfLines={2}>
          {preview.title}
        </Text>
        {preview.description && (
          <Text style={styles.linkPreviewDesc} numberOfLines={2}>
            {preview.description}
          </Text>
        )}
        <View style={styles.linkPreviewFooter}>
          <Ionicons name="link" size={10} color="#64748b" />
          <Text style={styles.linkPreviewUrl} numberOfLines={1}>
            {preview.url.split('/')[2]}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message, isSelf, currentUserId, sender, onReply, onReact,
  onRevokeForAll, onRevokeForMe, onForward, onOpenProfile, showAvatar = true,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isRevoked = message.isRevoked;
  const isSelfRevoked =
    message.revokedFor?.includes('__self__') ||
    (currentUserId != null && message.revokedFor?.includes(currentUserId));

  const ageMs = Date.now() - new Date(message.createdAt).getTime();
  const canRevokeForAll = isSelf && ageMs <= REVOKE_FOR_ALL_LIMIT_MS;
  const remainingMinutes = Math.max(0, Math.ceil((REVOKE_FOR_ALL_LIMIT_MS - ageMs) / 60000));

  const groupedReactions = useMemo(() => {
    if (!message.reactions?.length) return [];
    const map = new Map<string, number>();
    message.reactions.forEach((r) => map.set(r.emoji, (map.get(r.emoji) || 0) + 1));
    return Array.from(map.entries()).map(([emoji, count]) => ({ emoji, count }));
  }, [message.reactions]);

  if (isSelfRevoked) return null;

  if (isRevoked) {
    return (
      <View style={[styles.container, isSelf ? styles.containerSelf : styles.containerOther]}>
        {!isSelf && <View style={styles.avatarPlaceholder} />}
        <View style={styles.revokedBubble}>
          <Ionicons name="trash-outline" size={11} color="#94A3B8" />
          <Text style={styles.revokedText}>Tin nhắn đã bị thu hồi</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, isSelf ? styles.containerSelf : styles.containerOther]}>
        {/* Avatar */}
        {!isSelf && (
          showAvatar ? (
            <TouchableOpacity onPress={() => sender && onOpenProfile?.(sender)}>
              <Image
                source={{ uri: sender?.avatarUrl || `https://i.pravatar.cc/150?u=${message.senderId}` }}
                style={styles.avatar as any}
              />
            </TouchableOpacity>
          ) : <View style={styles.avatarPlaceholder} />
        )}

        <View style={[styles.bubbleWrapper, isSelf ? styles.wrapperSelf : styles.wrapperOther]}>
          {/* Sender Name */}
          {!isSelf && showAvatar && sender?.name && (
            <TouchableOpacity onPress={() => onOpenProfile?.(sender)}>
              <Text style={styles.senderName}>{sender.name}</Text>
            </TouchableOpacity>
          )}

          {/* Reply */}
          {message.replyTo && (
            <View style={[
              styles.replyContainer,
              isSelf ? styles.replySelf : styles.replyOther
            ]}>
              <Text style={[styles.replyLabel, isSelf ? styles.replyLabelSelf : styles.replyLabelOther]}>↩ Đã trả lời</Text>
              <Text style={[styles.replyContent, isSelf ? styles.replyContentSelf : styles.replyContentOther]} numberOfLines={1}>
                {message.replyTo.isRevoked ? '🚫 Tin nhắn đã thu hồi' : message.replyTo.content}
              </Text>
            </View>
          )}

          {/* Bubble Content */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowMenu(true)}
            style={[
              styles.bubble,
              isSelf ? styles.bubbleSelf : styles.bubbleOther
            ]}
          >
            {/* Text Message */}
            {!!message.content && (
              <Text style={[styles.messageText, isSelf ? styles.textSelf : styles.textOther]}>
                {message.content}
              </Text>
            )}

            {/* Link Preview */}
            {message.linkPreview && <LinkPreview preview={message.linkPreview} />}

            {/* Attachments (Images, Videos, Files) */}
            {message.attachments?.map((file, i) => {
              const isImg = file.fileType?.startsWith('image/');
              const isVid = file.fileType?.startsWith('video/');

              if (isImg) {
                return (
                  <TouchableOpacity key={i} onPress={() => Linking.openURL(file.url)} style={styles.attachmentMargin}>
                    <Image source={{ uri: file.url }} style={styles.imageAttachment as any} resizeMode="cover" />
                  </TouchableOpacity>
                );
              }

              if (isVid) {
                return <VideoMessageItem key={i} url={file.url} />;
              }

              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => Linking.openURL(file.url)}
                  style={[styles.fileAttachment, isSelf ? styles.fileSelf : styles.fileOther]}
                >
                  <Text style={styles.fileIconText}>{getFileIcon(file.fileName)}</Text>
                  <Text style={[styles.fileName, isSelf ? styles.fileNameSelf : styles.fileNameOther]} numberOfLines={1}>
                    {file.fileName}
                  </Text>
                  <Ionicons name="download-outline" size={14} color={isSelf ? '#bfdbfe' : '#64748b'} />
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>

          {/* Reactions */}
          {groupedReactions.length > 0 && (
            <View style={[styles.reactionRow, isSelf ? styles.reactionRowSelf : styles.reactionRowOther]}>
              {groupedReactions.map(({ emoji, count }) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => onReact?.(message.id, emoji)}
                  style={styles.reactionBadge}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Time */}
          <Text style={[styles.timeText, isSelf ? styles.timeSelf : styles.timeOther]}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </Text>
        </View>
      </View>

      {/* Action Menu Modal */}
      <Modal transparent visible={showMenu} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuContainer}>
            <View style={styles.emojiRow}>
              {QUICK_EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  onPress={() => { onReact?.(message.id, e); setShowMenu(false); }}
                  style={styles.emojiBtn}
                >
                  <Text style={styles.emojiBtnText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem} onPress={() => { onReply?.(message); setShowMenu(false); }}>
              <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="arrow-undo" size={16} color="#3b82f6" />
              </View>
              <Text style={styles.menuText}>Trả lời</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem} onPress={() => { onForward?.(message); setShowMenu(false); }}>
              <View style={[styles.menuIcon, { backgroundColor: '#f8fafc' }]}>
                <Ionicons name="arrow-redo" size={16} color="#64748b" />
              </View>
              <Text style={styles.menuText}>Chuyển tiếp</Text>
            </TouchableOpacity>

            {isSelf && (
              <>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={[styles.menuItem, !canRevokeForAll && { opacity: 0.5 }]}
                  onPress={() => {
                    if (!canRevokeForAll) {
                      Alert.alert("Hết hạn", "Bạn chỉ có thể thu hồi tin nhắn trong vòng 15 phút.");
                      return;
                    }
                    onRevokeForAll?.(message.id);
                    setShowMenu(false);
                  }}
                >
                  <View style={[styles.menuIcon, { backgroundColor: canRevokeForAll ? '#fff1f2' : '#f8fafc' }]}>
                    <Ionicons name="trash" size={16} color={canRevokeForAll ? '#ef4444' : '#94a3b8'} />
                  </View>
                  <View>
                    <Text style={[styles.menuText, canRevokeForAll ? { color: '#e11d48' } : { color: '#94a3b8' }]}>Thu hồi với mọi người</Text>
                    <Text style={styles.menuSubtext}>
                      {canRevokeForAll ? `Còn ${remainingMinutes} phút` : 'Đã quá 15 phút'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { onRevokeForMe?.(message.id); setShowMenu(false); }}>
              <View style={[styles.menuIcon, { backgroundColor: '#f8fafc' }]}>
                <Ionicons name="eye-off-outline" size={16} color="#64748b" />
              </View>
              <Text style={styles.menuText}>Ẩn với chỉ mình tôi</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  containerSelf: { justifyContent: 'flex-end' },
  containerOther: { justifyContent: 'flex-start' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 4,
  },
  avatarPlaceholder: { width: 28, marginRight: 8 },
  bubbleWrapper: { maxWidth: '76%' },
  wrapperSelf: { alignItems: 'flex-end' },
  wrapperOther: { alignItems: 'flex-start' },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
    marginLeft: 2,
  },
  revokedBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  revokedText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  replyContainer: {
    borderRadius: 8,
    borderLeftWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 4,
    maxWidth: '100%',
  },
  replySelf: { backgroundColor: '#DBEAFE', borderLeftColor: '#93C5FD' },
  replyOther: { backgroundColor: '#F1F5F9', borderLeftColor: '#CBD5E1' },
  replyLabel: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  replyLabelSelf: { color: '#3B82F6' },
  replyLabelOther: { color: '#64748B' },
  replyContent: { fontSize: 12 },
  replyContentSelf: { color: '#1E40AF' },
  replyContentOther: { color: '#334155' },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  bubbleSelf: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  textSelf: { color: '#FFFFFF' },
  textOther: { color: '#0F172A' },
  timeText: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  timeSelf: { marginRight: 2 },
  timeOther: { marginLeft: 2 },
  // Attachments
  attachmentMargin: { marginTop: 6 },
  imageAttachment: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  videoContainer: {
    marginTop: 6,
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoView: { width: '100%', height: '100%' },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlayText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
  },
  fileSelf: { backgroundColor: 'rgba(255,255,255,0.2)' },
  fileOther: { backgroundColor: '#F8FAFC' },
  fileIconText: { fontSize: 18, marginRight: 8 },
  fileName: { fontSize: 12, fontWeight: '500', flex: 1, marginRight: 6 },
  fileNameSelf: { color: '#EFF6FF' },
  fileNameOther: { color: '#334155' },
  // Link Preview
  linkPreviewContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  linkPreviewImage: { width: '100%', height: 128 },
  linkPreviewContent: { padding: 12 },
  linkPreviewTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  linkPreviewDesc: { fontSize: 12, color: '#64748B', marginTop: 4 },
  linkPreviewFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  linkPreviewUrl: { fontSize: 10, color: '#94A3B8', marginLeft: 4 },
  // Reactions
  reactionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  reactionRowSelf: { justifyContent: 'flex-end' },
  reactionRowOther: { justifyContent: 'flex-start' },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { fontSize: 11, color: '#64748B', marginLeft: 2, fontWeight: '600' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: 280,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emojiBtnText: { fontSize: 24 },
  menuDivider: { height: 1, backgroundColor: '#F1F5F9' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: { fontSize: 16, fontWeight: '500', color: '#1E293B' },
  menuSubtext: { fontSize: 10, color: '#94A3B8' },
});
