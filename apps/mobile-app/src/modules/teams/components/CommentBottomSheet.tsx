import React, { useCallback, useMemo, useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker'; // IMPORT DOCUMENT PICKER
import PostInputBox from './PostInputBox';
import CommentItem from './CommentItem';
import { useCommentRealtime } from '@/shared/hooks/useCommentRealtime';
import type { Comment } from '@/shared/hooks/useCommentRealtime';

interface CommentBottomSheetProps {
  postId: string | null;
  visible: boolean;
  onClose: () => void;
}

export default function CommentBottomSheet({ postId, visible, onClose }: CommentBottomSheetProps) {
  const { 
    comments, 
    loading, 
    createComment, 
    editComment, 
    deleteComment, 
    getTopLevelComments, 
    getRepliesForComment 
  } = useCommentRealtime(postId);

  const [inputValue, setInputValue] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // STATE LƯU TRỮ FILE ĐÍNH KÈM
  const [attachments, setAttachments] = useState<any[]>([]); 

  const topComments = useMemo(() => getTopLevelComments(), [comments]);

  // ==========================================
  // XỬ LÝ CHỌN FILE
  // ==========================================
  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Chọn mọi loại file
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        setAttachments((prev) => [...prev, ...result.assets]);
      }
    } catch (err) {
      console.error("Lỗi khi chọn file:", err);
      Alert.alert("Lỗi", "Không thể đính kèm file lúc này.");
    }
  };

  // Hàm xóa file khỏi danh sách preview
  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // ==========================================
  // XỬ LÝ GỬI BÌNH LUẬN
  // ==========================================
  const handleSend = useCallback(async () => {
    // Chỉ chặn gửi nếu KHÔNG CÓ chữ VÀ KHÔNG CÓ file
    if (!postId || (!inputValue.trim() && attachments.length === 0)) return;
    
    setIsSubmitting(true);
    
    const currentInput = inputValue;
    const currentReplyTo = replyTo ? replyTo.id : null;
    const currentEditingId = editingComment ? editingComment.id : null;
    const currentAttachments = [...attachments]; // Copy file hiện tại

    // Reset UI ngay lập tức để UX mượt
    setInputValue('');
    setReplyTo(null);
    setEditingComment(null);
    setAttachments([]); // Xóa preview file
    Keyboard.dismiss(); 

    try {
      if (currentEditingId) {
        // Cập nhật bình luận (Lưu ý: API Update thường không nhận file, 
        // tùy thuộc vào Backend của bạn, ở đây tôi chỉ gửi content)
        await editComment(currentEditingId, { content: currentInput });
      } else {
        // Tạo bình luận mới hoặc phản hồi, TRUYỀN THÊM FILES VÀO ĐÂY
        await createComment({ 
          postId, 
          content: currentInput, 
          replyToCommentId: currentReplyTo 
        }, currentAttachments); // Truyền files vào tham số thứ 2
      }
    } catch (err) {
      console.error('[CommentBottomSheet] Send failed', err);
      Alert.alert("Lỗi", "Không thể gửi bình luận, vui lòng thử lại.");
      // Phục hồi lại trạng thái nếu API lỗi
      setInputValue(currentInput);
      setAttachments(currentAttachments);
      if (currentEditingId) setEditingComment(editingComment);
      if (currentReplyTo) setReplyTo(replyTo);
    } finally {
      setIsSubmitting(false);
    }
  }, [postId, inputValue, attachments, replyTo, editingComment, createComment, editComment]);

  // HÀM XỬ LÝ KHI BẤM SỬA TỪ COMMENT ITEM
  const handleEditComment = useCallback((comment: Comment) => {
    setEditingComment(comment);
    setInputValue(comment.content);
    setReplyTo(null); 
    // Nếu bạn cho phép sửa cả file, bạn sẽ cần load attachment của comment đó vào state `attachments` ở đây.
  }, []);

  // HÀM XỬ LÝ KHI BẤM XÓA TỪ COMMENT ITEM
  const handleDeleteComment = useCallback((commentId: string) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa bình luận này không?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteComment(commentId);
              if (editingComment?.id === commentId) {
                setEditingComment(null);
                setInputValue('');
              }
            } catch (error) {
              console.error("[CommentBottomSheet] Failed to delete comment:", error);
            }
          }
        }
      ]
    );
  }, [deleteComment, editingComment]);

  const renderItem = ({ item }: { item: Comment }) => (
    <CommentItem
      comment={item}
      replies={getRepliesForComment(item.id)}
      onReply={(id, name) => {
        setReplyTo({ id, name });
        setEditingComment(null);
      }}
      onLike={(id) => console.log('Like comment:', id)}
      onEdit={handleEditComment}
      onDelete={handleDeleteComment}
      // TRUYỀN SỰ KIỆN BẤM VÀO FILE (Nếu bạn muốn mở file khi bấm vào)
      onAttachmentPress={(file) => console.log('Mở file:', file.fileName)}
    />
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoiding} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onClose(); }}>
          <View style={styles.backdropOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Comments ({comments.length})</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#1868f0" />
              </View>
            ) : (
              <FlatList
                data={topComments}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
                  </View>
                }
              />
            )}
          </View>

          <PostInputBox
            placeholder={
              editingComment ? `Editing comment...` : 
              replyTo ? `Reply to ${replyTo.name}` : 
              'Write a comment...'
            }
            value={inputValue}
            onChangeText={setInputValue}
            
            // TRUYỀN CÁC PROPS LIÊN QUAN ĐẾN FILE VÀO PostInputBox
            onAttach={handleAttachFile}
            attachments={attachments as any}
            onRemoveAttachment={handleRemoveAttachment}
            
            onSend={handleSend}
            isSubmitting={isSubmitting}
            replyToName={
              editingComment ? "Editing..." : 
              replyTo ? replyTo.name : 
              null
            }
            onCancelReply={() => {
              setReplyTo(null);
              setEditingComment(null);
              setInputValue('');
              setAttachments([]); // Hủy reply/edit thì xóa file preview luôn
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: { flex: 1, justifyContent: 'flex-end' },
  backdropOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  container: { 
    backgroundColor: '#fff', 
    height: '75%', 
    borderTopLeftRadius: 12, 
    borderTopRightRadius: 12, 
    paddingBottom: Platform.OS === 'ios' ? 20 : 10 
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  content: { flex: 1 },
  loadingWrap: { height: 200, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyWrap: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center' },
});