import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePostReactions, type ReactionType } from '@/shared/hooks/usePostReactions';
import ReactionPicker from './ReactionPicker';
import type { Comment } from '@/shared/hooks/useCommentRealtime';

// Tạm định nghĩa interface cho Attachment nếu bạn chưa có trong useCommentRealtime
export interface CommentAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  size: number;
}

interface CommentItemProps {
  comment: Comment;
  replies?: Comment[];
  onReply: (commentId: string, authorName: string) => void;
  onLike: (commentId: string) => void;
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
  // Bổ sung hàm bấm vào file/ảnh
  onAttachmentPress?: (attachment: CommentAttachment) => void;
}

// ==========================================
// CÁC HÀM TIỆN ÍCH (HELPERS)
// ==========================================
const getInitials = (name: string) => {
  if (!name) return 'U';
  const clean = name.includes('@') ? name.split('@')[0] : name;
  const parts = clean.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const formatTime = (createdAt: string) => {
  try {
    const date = new Date(createdAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString();
  } catch {
    return 'Unknown';
  }
};

const getReactionEmoji = (reactionType: string | null | undefined): string => {
  switch (reactionType?.toUpperCase()) {
    case 'LIKE': return '👍';
    case 'LOVE': return '❤️';
    case 'HAHA': return '😂';
    case 'WOW': return '😮';
    case 'SAD': return '😢';
    case 'ANGRY': return '😡';
    default: return '👍';
  }
};

const getReactionText = (reactionType: string | null | undefined): string => {
  switch (reactionType?.toUpperCase()) {
    case 'LIKE': return 'Like';
    case 'LOVE': return 'Love';
    case 'HAHA': return 'Haha';
    case 'WOW': return 'Wow';
    case 'SAD': return 'Sad';
    case 'ANGRY': return 'Angry';
    default: return 'Like';
  }
};

const renderReactionIcon = (reaction: string | null | undefined, size = 16) => {
  if (!reaction) return <MaterialCommunityIcons name="thumb-up-outline" size={size} color="#64748b" />;
  if (reaction === 'LIKE') return <MaterialCommunityIcons name="thumb-up" size={size} color="#1868f0" />;
  return <Text style={{ fontSize: size - 2 }}>{getReactionEmoji(reaction)}</Text>;
};

const isImage = (fileType: string): boolean => {
  return fileType?.startsWith('image/') ?? false;
};

const isVideo = (fileType: string): boolean => {
  return fileType?.startsWith('video/') ?? false;
};

const getFileIcon = (fileName: string, fileType: string) => {
  const name = (fileName || '').toLowerCase();
  if (fileType?.includes('pdf') || name.includes('.pdf')) return { icon: 'file-pdf-box', color: '#ef4444' };
  if (fileType?.includes('word') || name.match(/\.(doc|docx)$/)) return { icon: 'file-word-box', color: '#3b82f6' };
  if (fileType?.includes('excel') || name.match(/\.(xls|xlsx|csv)$/)) return { icon: 'file-excel-box', color: '#22c55e' };
  return { icon: 'file-document', color: '#64748b' };
};

// ==========================================
// COMPONENT: BÌNH LUẬN CON (REPLY)
// ==========================================
const ReplyItem = ({ reply, onReply, onEdit, onDelete, onLike, onAttachmentPress }: any) => {
  const { toggleReaction, loading: reactionLoading } = usePostReactions();
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);
  const [optimisticReaction, setOptimisticReaction] = useState<ReactionType | null>(null);

  const displayCount = optimisticCount !== null ? optimisticCount : reply.reactionCount;
  const displayReaction = optimisticReaction !== null ? optimisticReaction : reply.userReaction;

  const handleReplyMenuPress = () => {
    Alert.alert("Tùy chọn", "Bạn muốn làm gì với phản hồi này?", [
      { text: "Hủy", style: "cancel" },
      { text: "Sửa", onPress: () => onEdit?.(reply) },
      { text: "Xóa", style: "destructive", onPress: () => onDelete?.(reply.id) },
    ]);
  };

  const handleReaction = async (reactionType: ReactionType) => {
    setIsPickerVisible(false);
    if (isReacting || reactionLoading) return;
    setIsReacting(true);

    const previousCount = reply.reactionCount;
    const previousReaction = reply.userReaction;
    
    let newCount = previousCount;
    if (!previousReaction && reactionType) newCount += 1;
    if (previousReaction && !reactionType) newCount -= 1;

    setOptimisticCount(newCount);
    setOptimisticReaction(reactionType);

    try {
      await toggleReaction({ targetId: reply.id, targetType: 'COMMENT', reactionType });
      onLike?.(reply.id);
    } catch (error) {
      setOptimisticCount(null);
      setOptimisticReaction(null);
    } finally {
      setIsReacting(false);
    }
  };

  return (
    <View style={styles.replyRow}>
      {reply.authorAvatar ? (
        <Image source={{ uri: reply.authorAvatar }} style={styles.replyAvatar} />
      ) : (
        <View style={styles.replyAvatarPlaceholder}>
          <Text style={styles.replyInitials}>{getInitials(reply.authorName)}</Text>
        </View>
      )}
      <View style={styles.replyBody}>
        <View style={styles.replyBubble}>
          <View style={styles.bubbleHeader}>
            <Text style={styles.replyAuthor}>{reply.authorName}</Text>
            <TouchableOpacity onPress={handleReplyMenuPress} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="ellipsis-horizontal" size={14} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <Text style={styles.replyContent}>{reply.content}</Text>
        </View>

        {/* HIỂN THỊ FILE ĐÍNH KÈM CHO REPLY */}
        {reply.attachments && reply.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {reply.attachments.map((attachment: any) => {
              if (isImage(attachment.fileType)) {
                return (
                  <TouchableOpacity key={attachment.id} style={styles.imageAttachment} onPress={() => onAttachmentPress?.(attachment)} activeOpacity={0.7}>
                    <Image source={{ uri: attachment.fileUrl }} style={styles.attachmentImage} />
                  </TouchableOpacity>
                );
              }
              if (isVideo(attachment.fileType)) {
                return (
                  <TouchableOpacity key={attachment.id} style={styles.videoAttachment} onPress={() => onAttachmentPress?.(attachment)} activeOpacity={0.7}>
                    <Image source={{ uri: attachment.fileUrl }} style={styles.attachmentImage} />
                    <View style={styles.videoOverlay}><Ionicons name="play-circle" size={32} color="white" /></View>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity key={attachment.id} style={styles.fileAttachment} onPress={() => onAttachmentPress?.(attachment)}>
                  <MaterialCommunityIcons name={getFileIcon(attachment.fileName, attachment.fileType).icon as any} size={20} color={getFileIcon(attachment.fileName, attachment.fileType).color} />
                  <View style={styles.fileInfo}>
                    <Text numberOfLines={1} style={styles.fileName}>{attachment.fileName}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.replyActionsRow}>
          <Text style={styles.time}>{formatTime(reply.createdAt)}</Text>
          
          <TouchableOpacity 
            onPress={() => handleReaction(displayReaction === 'LIKE' ? ('NONE' as any) : 'LIKE')}
            onLongPress={() => setIsPickerVisible(true)}
            delayLongPress={300}
            style={styles.actionBtn}
            disabled={isReacting || reactionLoading}
          >
            {isReacting || reactionLoading ? (
              <ActivityIndicator size={12} color="#1868f0" />
            ) : (
              <>
                {renderReactionIcon(displayReaction, 14)}
                <Text style={[styles.actionText, { fontSize: 12 }, displayReaction && { color: '#1868f0' }]}>
                  {getReactionText(displayReaction as any)} {displayCount > 0 ? `· ${displayCount}` : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onReply(reply.id, reply.authorName)} style={styles.actionBtn}>
            <Text style={[styles.actionText, { fontSize: 12 }]}>Reply</Text>
          </TouchableOpacity>
        </View>
        
        <ReactionPicker visible={isPickerVisible} onClose={() => setIsPickerVisible(false)} onSelect={handleReaction} />
      </View>
    </View>
  );
};

// ==========================================
// COMPONENT: BÌNH LUẬN GỐC (ROOT COMMENT)
// ==========================================
export default function CommentItem({ comment, replies = [], onReply, onLike, onEdit, onDelete, onAttachmentPress }: CommentItemProps) {
  const { toggleReaction, loading: reactionLoading } = usePostReactions();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);
  const [optimisticReaction, setOptimisticReaction] = useState<ReactionType | null>(null);

  const displayCount = optimisticCount !== null ? optimisticCount : comment.reactionCount;
  const displayReaction = optimisticReaction !== null ? optimisticReaction : comment.userReaction;

  const handleCommentMenuPress = () => {
    Alert.alert("Tùy chọn", "Bạn muốn làm gì với bình luận này?", [
      { text: "Hủy", style: "cancel" },
      { text: "Sửa", onPress: () => onEdit?.(comment) },
      { text: "Xóa", style: "destructive", onPress: () => onDelete?.(comment.id) },
    ]);
  };

  const handleReaction = async (reactionType: ReactionType) => {
    setIsPickerVisible(false);
    if (isReacting || reactionLoading) return;
    setIsReacting(true);

    const previousCount = comment.reactionCount;
    const previousReaction = comment.userReaction;
    
    let newCount = previousCount;
    if (!previousReaction && reactionType) newCount += 1;
    if (previousReaction && !reactionType) newCount -= 1;

    setOptimisticCount(newCount);
    setOptimisticReaction(reactionType);

    try {
      await toggleReaction({ targetId: comment.id, targetType: 'COMMENT', reactionType });
      onLike(comment.id);
    } catch (error) {
      setOptimisticCount(null);
      setOptimisticReaction(null);
    } finally {
      setIsReacting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {comment.authorAvatar ? (
          <Image source={{ uri: comment.authorAvatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{getInitials(comment.authorName)}</Text>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.bubble}>
            <View style={styles.bubbleHeader}>
              <Text style={styles.author}>{comment.authorName}</Text>
              <TouchableOpacity onPress={handleCommentMenuPress} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Ionicons name="ellipsis-horizontal" size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.content}>{comment.content}</Text>
          </View>

          {/* HIỂN THỊ FILE ĐÍNH KÈM CHO COMMENT GỐC */}
          {(comment as any).attachments && (comment as any).attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {(comment as any).attachments.map((attachment: any) => {
                if (isImage(attachment.fileType)) {
                  return (
                    <TouchableOpacity key={attachment.id} style={styles.imageAttachment} onPress={() => onAttachmentPress?.(attachment)} activeOpacity={0.7}>
                      <Image source={{ uri: attachment.fileUrl }} style={styles.attachmentImage} />
                    </TouchableOpacity>
                  );
                }
                if (isVideo(attachment.fileType)) {
                  return (
                    <TouchableOpacity key={attachment.id} style={styles.videoAttachment} onPress={() => onAttachmentPress?.(attachment)} activeOpacity={0.7}>
                      <Image source={{ uri: attachment.fileUrl }} style={styles.attachmentImage} />
                      <View style={styles.videoOverlay}><Ionicons name="play-circle" size={48} color="white" /></View>
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity key={attachment.id} style={styles.fileAttachment} onPress={() => onAttachmentPress?.(attachment)}>
                    <MaterialCommunityIcons name={getFileIcon(attachment.fileName, attachment.fileType).icon as any} size={28} color={getFileIcon(attachment.fileName, attachment.fileType).color} />
                    <View style={styles.fileInfo}>
                      <Text numberOfLines={1} style={styles.fileName}>{attachment.fileName}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.actionsRow}>
            <Text style={styles.time}>{formatTime(comment.createdAt)}</Text>
            
            <TouchableOpacity 
              onPress={() => handleReaction(displayReaction === 'LIKE' ? ('NONE' as any) : 'LIKE')}
              onLongPress={() => setIsPickerVisible(true)}
              delayLongPress={300}
              style={styles.actionBtn}
              disabled={isReacting || reactionLoading}
            >
              {isReacting || reactionLoading ? (
                <ActivityIndicator size={14} color="#1868f0" />
              ) : (
                <>
                  {renderReactionIcon(displayReaction, 16)}
                  <Text style={[styles.actionText, displayReaction && { color: '#1868f0' }]}>
                    {getReactionText(displayReaction as any)} {displayCount > 0 ? `· ${displayCount}` : ''}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onReply(comment.id, comment.authorName)} style={styles.actionBtn}>
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>

            {replies.length > 0 && (
              <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.actionBtn}>
                <Text style={[styles.actionText, { color: '#1868f0', fontWeight: '700' }]}>
                  {isExpanded ? 'Hide replies' : `Show ${replies.length} replies`}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ReactionPicker visible={isPickerVisible} onClose={() => setIsPickerVisible(false)} onSelect={handleReaction} />

          {isExpanded && replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {replies.map((r) => (
                <ReplyItem 
                  key={r.id} 
                  reply={r} 
                  onReply={onReply} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                  onLike={onLike}
                  onAttachmentPress={onAttachmentPress}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1868f0', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarInitials: { color: '#fff', fontWeight: '700' },
  body: { flex: 1, zIndex: 1 },
  
  bubble: { backgroundColor: '#f1f5f9', padding: 10, borderRadius: 12 },
  bubbleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  author: { fontWeight: '700', color: '#1e293b' },
  content: { color: '#475569' },
  
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, zIndex: -1 },
  time: { fontSize: 12, color: '#94a3b8' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  actionText: { marginLeft: 4, color: '#64748b', fontWeight: '600' },
  
  repliesContainer: { marginTop: 12, marginLeft: 36, borderLeftWidth: 1, borderLeftColor: '#e2e8f0', paddingLeft: 12 },
  replyRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  replyAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  replyAvatarPlaceholder: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#64748b', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  replyInitials: { color: '#fff', fontWeight: '700', fontSize: 10 },
  
  replyBody: { flex: 1, zIndex: 1 },
  replyBubble: { backgroundColor: '#f8fafc', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  replyAuthor: { fontWeight: '700', fontSize: 13 },
  replyContent: { color: '#475569', fontSize: 13, marginTop: 2 },
  replyActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, zIndex: -1 },

  // STYLES MỚI CHO ĐÍNH KÈM
  attachmentsContainer: { marginTop: 6, gap: 6 },
  imageAttachment: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#f1f5f9' },
  videoAttachment: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  attachmentImage: { width: '100%', height: 150, resizeMode: 'cover' }, // Giảm size ảnh trong comment một chút
  videoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.3)' },
  fileAttachment: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  fileInfo: { marginLeft: 10, flex: 1 },
  fileName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
});