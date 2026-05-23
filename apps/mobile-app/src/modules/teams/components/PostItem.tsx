import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePostReactions, type ReactionType } from '@/shared/hooks/usePostReactions';
import ReactionPicker from './ReactionPicker';
import type { Post, PostAttachment } from '@/shared/hooks/usePostRealtime';

interface PostItemProps {
  post: Post;
  onPressComment?: () => void;
  onAttachmentPress?: (attachment: PostAttachment) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

const getInitials = (name: string): string => {
  if (!name) return 'U';
  const cleanName = name.includes('@') ? name.split('@')[0] : name;
  const parts = cleanName.trim().split(/\s+/);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  const firstLetter = parts[0].charAt(0);
  const lastLetter = parts[parts.length - 1].charAt(0);
  return (firstLetter + lastLetter).toUpperCase();
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

const formatTimeAgo = (createdAt: string): string => {
  try {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return 'Unknown'; }
};

const getFileIcon = (fileName: string, fileType: string) => {
  const name = (fileName || '').toLowerCase();
  if (fileType?.includes('pdf') || name.includes('.pdf')) return { icon: 'file-pdf-box', color: '#ef4444' };
  if (fileType?.includes('word') || name.match(/\.(doc|docx)$/)) return { icon: 'file-word-box', color: '#3b82f6' };
  if (fileType?.includes('excel') || name.match(/\.(xls|xlsx|csv)$/)) return { icon: 'file-excel-box', color: '#22c55e' };
  return { icon: 'file-document', color: '#64748b' };
};

const isImage = (fileType: string): boolean => {
  return fileType?.startsWith('image/') ?? false;
};

const isVideo = (fileType: string): boolean => {
  return fileType?.startsWith('video/') ?? false;
};

export default function PostItem({ post, onPressComment, onAttachmentPress, onEdit, onDelete }: PostItemProps) {
  const { toggleReaction, loading: reactionLoading } = usePostReactions();
  
  const [isReacting, setIsReacting] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  
  // Logic cập nhật giao diện (Optimistic UI) giúp app mượt hơn
  const [optimisticReactionCount, setOptimisticReactionCount] = useState<number | null>(null);
  const [optimisticUserReaction, setOptimisticUserReaction] = useState<ReactionType | null>(null);

  const displayReactionCount = optimisticReactionCount !== null ? optimisticReactionCount : post.reactionCount;
  const displayUserReaction = optimisticUserReaction !== null ? optimisticUserReaction : post.userReaction;

  const handleMenuPress = () => {
    Alert.alert("Tùy chọn", "Bạn muốn làm gì với bài viết này?", [
      { text: "Hủy", style: "cancel" },
      { text: "Sửa", onPress: () => onEdit?.(post) },
      { text: "Xóa", style: "destructive", onPress: () => onDelete?.(post.id) },
    ]);
  };

  const handleLikePress = async () => {
    if (isReacting || reactionLoading) return;
    setIsReacting(true);

    const previousCount = post.reactionCount;
    const previousReaction = post.userReaction;
    const newReactionCount = previousReaction === 'LIKE' ? previousCount - 1 : previousCount + 1;
    
    setOptimisticReactionCount(newReactionCount);
    setOptimisticUserReaction(previousReaction === 'LIKE' ? null : 'LIKE');

    try {
      await toggleReaction({ targetId: post.id, targetType: 'POST', reactionType: 'LIKE' });
    } catch (err) {
      setOptimisticReactionCount(null);
      setOptimisticUserReaction(null);
    } finally { 
      setIsReacting(false); 
    }
  };

  const handleSelectReaction = async (reaction: ReactionType) => {
    setIsPickerVisible(false);
    if (isReacting || reactionLoading) return;
    setIsReacting(true);

    const previousCount = post.reactionCount;
    const previousReaction = post.userReaction;
    const newReactionCount = previousReaction ? previousCount : previousCount + 1;
    
    setOptimisticReactionCount(newReactionCount);
    setOptimisticUserReaction(reaction);

    try {
      await toggleReaction({ targetId: post.id, targetType: 'POST', reactionType: reaction });
    } catch (err) {
      setOptimisticReactionCount(null);
      setOptimisticUserReaction(null);
    } finally { 
      setIsReacting(false); 
    }
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        {post.authorAvatar ? (
          <Image source={{ uri: post.authorAvatar }} style={styles.postAvatar} />
        ) : (
          <View style={styles.postAvatarPlaceholder}><Text style={styles.postAvatarText}>{getInitials(post.authorName)}</Text></View>
        )}
        <View style={styles.postHeaderText}>
          <Text style={styles.postAuthor} numberOfLines={1}>{post.authorName}</Text>
          <Text style={styles.postTime}>{formatTimeAgo(post.createdAt)}</Text>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentSection}>
        <Text style={styles.postContent}>{post.content}</Text>
      </View>

      {post.attachments && post.attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          {post.attachments.map((attachment) => {
            
            // Xử lý hiển thị Ảnh đính kèm
            if (isImage(attachment.fileType)) {
              return (
                <TouchableOpacity key={attachment.id} style={styles.imageAttachment} onPress={() => onAttachmentPress?.(attachment)} activeOpacity={0.7}>
                  <Image source={{ uri: attachment.fileUrl }} style={styles.attachmentImage} />
                </TouchableOpacity>
              );
            }

            // Xử lý hiển thị Video đính kèm
            if (isVideo(attachment.fileType)) {
              return (
                <TouchableOpacity key={attachment.id} style={styles.videoAttachment} onPress={() => onAttachmentPress?.(attachment)} activeOpacity={0.7}>
                  <Image source={{ uri: attachment.fileUrl }} style={styles.attachmentImage} />
                  <View style={styles.videoOverlay}>
                    <Ionicons name="play-circle" size={48} color="white" />
                  </View>
                </TouchableOpacity>
              );
            }

            // Xử lý hiển thị File thông thường (PDF, Word, Excel...)
            return (
              <TouchableOpacity key={attachment.id} style={styles.fileAttachment} onPress={() => onAttachmentPress?.(attachment)}>
                <MaterialCommunityIcons name={getFileIcon(attachment.fileName, attachment.fileType).icon as any} size={28} color={getFileIcon(attachment.fileName, attachment.fileType).color} />
                <View style={styles.fileInfo}>
                  <Text numberOfLines={1}>{attachment.fileName}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* REACTION COUNT */}
      {displayReactionCount > 0 && (
        <View style={styles.reactionBar}>
          <View style={styles.reactionBadge}>
            <Text style={styles.reactionEmoji}>{getReactionEmoji((displayUserReaction || 'LIKE') as any)}</Text>
            <Text style={styles.reactionCount}>{displayReactionCount}</Text>
          </View>
        </View>
      )}

      <View style={styles.postFooter}>
        <TouchableOpacity 
          style={styles.footerButton} 
          onPress={handleLikePress}
          onLongPress={() => setIsPickerVisible(true)}
          delayLongPress={300}
        >
          {isReacting || reactionLoading ? (
            <ActivityIndicator size={18} color="#1868f0" />
          ) : (
            <>
              <MaterialCommunityIcons 
                name={displayUserReaction ? 'thumb-up' : 'thumb-up-outline'} 
                size={18} 
                color={displayUserReaction ? '#1868f0' : '#64748b'} 
              />
              <Text style={[styles.footerButtonText, displayUserReaction && { color: '#1868f0' }]}>Like</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => onPressComment?.()}>
          <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
          <Text style={styles.footerButtonText}>{post.commentCount > 0 ? `${post.commentCount}` : 'Comment'}</Text>
        </TouchableOpacity>
      </View>
      
      <ReactionPicker 
        visible={isPickerVisible} 
        onClose={() => setIsPickerVisible(false)} 
        onSelect={handleSelectReaction} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  postCard: { backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 12, marginHorizontal: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  postAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  postAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1868f0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  postAvatarText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  postHeaderText: { flex: 1 },
  postAuthor: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  postTime: { fontSize: 12, color: '#94a3b8' },
  menuButton: { padding: 8, marginRight: -8 },
  contentSection: { padding: 12 },
  postContent: { fontSize: 14, color: '#475569', lineHeight: 20 },
  
  attachmentsContainer: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  imageAttachment: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#f1f5f9' },
  videoAttachment: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  attachmentImage: { width: '100%', height: 200, resizeMode: 'cover' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.3)' },
  fileAttachment: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  fileInfo: { marginLeft: 12, flex: 1 },
  
  reactionBar: { paddingHorizontal: 12, paddingBottom: 8 },
  reactionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 16, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', gap: 4 },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  
  postFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingVertical: 8 },
  footerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  footerButtonText: { fontSize: 13, fontWeight: '600', color: '#64748b' }
});