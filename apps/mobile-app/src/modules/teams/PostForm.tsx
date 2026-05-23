import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  SafeAreaView, Image, KeyboardAvoidingView, Platform, 
  StatusBar, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker'; // IMPORT THƯ VIỆN CHỌN FILE
import { usePostRealtime, Post } from '@/shared/hooks/usePostRealtime';

interface CreatePostProps {
  onBack: () => void;
  teamTitle: string;
  classId: string;
  postToEdit?: Post | null;
}

// Helper kiểm tra file ảnh
const isImage = (mimeType?: string) => {
  return mimeType?.startsWith('image/') ?? false;
};

export default function CreatePost({ onBack, teamTitle, classId, postToEdit }: CreatePostProps) {
  const [content, setContent] = useState(postToEdit?.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]); // Quản lý danh sách file

  const { createPost, editPost } = usePostRealtime(classId);

  // Điều kiện sáng nút Post: Có chữ HOẶC có file đính kèm
  const canSubmit = content.trim().length > 0 || attachedFiles.length > 0;

  // ==========================================
  // XỬ LÝ CHỌN VÀ XÓA FILE
  // ==========================================
  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Chọn mọi loại file
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        setAttachedFiles((prev) => [...prev, ...result.assets]);
      }
    } catch (err) {
      console.error("Lỗi chọn file:", err);
      Alert.alert("Lỗi", "Không thể đính kèm file lúc này.");
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ==========================================
  // XỬ LÝ ĐĂNG BÀI
  // ==========================================
  const handlePostSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (postToEdit) {
        // Chế độ Sửa (Thường API sửa bài viết gốc chỉ sửa nội dung)
        await editPost(postToEdit.id, { content: content.trim() });
      } else {
        // Chế độ Đăng mới (Gửi kèm attachedFiles)
        const payload = {
          classId: classId.toString(),
          content: content.trim(),
          type: 'DISCUSSION' 
        };
        await createPost(payload, attachedFiles); // Mảng files được truyền vào đây
      }
      onBack();
    } catch (err) {
      console.error('[CreatePost] Submit error:', err);
      Alert.alert('Thất bại', 'Đã xảy ra lỗi, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} disabled={isSubmitting}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{postToEdit ? 'Edit Post' : 'New Post'}</Text>
        
        <TouchableOpacity 
          disabled={!canSubmit || isSubmitting} 
          style={[styles.postBtn, (!canSubmit || isSubmitting) && styles.disabledBtn]}
          onPress={handlePostSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.postBtnText}>{postToEdit ? 'Update' : 'Post'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
          
          {/* USER INFO */}
          <View style={styles.userRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/150?u=me' }} style={styles.avatar} />
            <View>
              <Text style={styles.userName}>Tran Hau</Text>
              <View style={styles.targetTeam}>
                <Text style={styles.targetText}>Posting to </Text>
                <Text style={styles.teamName}>{teamTitle}</Text>
              </View>
            </View>
          </View>

          {/* Ô NHẬP NỘI DUNG */}
          <TextInput
            style={styles.input}
            placeholder="Share something with your class..."
            placeholderTextColor="#94a3b8"
            multiline
            autoFocus={true}
            value={content}
            onChangeText={setContent}
            editable={!isSubmitting}
          />

          {/* DANH SÁCH PREVIEW FILE */}
          {attachedFiles.length > 0 && (
            <View style={styles.previewContainer}>
              {attachedFiles.map((file, index) => (
                <View key={index} style={styles.previewItem}>
                  {isImage(file.mimeType) ? (
                    <Image source={{ uri: file.uri }} style={styles.previewThumb} />
                  ) : (
                    <View style={styles.previewIconBox}>
                      <Ionicons name="document-text" size={24} color="#64748b" />
                    </View>
                  )}
                  
                  <View style={styles.previewTextContainer}>
                    <Text numberOfLines={1} style={styles.previewText}>{file.name}</Text>
                    <Text style={styles.previewSize}>
                      {file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'Unknown size'}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => handleRemoveFile(index)} style={styles.removeBtn}>
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* THANH CÔNG CỤ DƯỚI CÙNG (Gắn file) */}
        {!postToEdit && (
          <View style={styles.toolbar}>
            <TouchableOpacity onPress={handleAttachFile} style={styles.toolbarBtn} disabled={isSubmitting}>
              <Ionicons name="image-outline" size={24} color="#1868f0" />
              <Text style={styles.toolbarText}>Thêm ảnh/file đính kèm</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cancelText: { fontSize: 16, color: '#64748b', fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
  postBtn: { backgroundColor: '#1868f0', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, minWidth: 65, justifyContent: 'center', alignItems: 'center' },
  disabledBtn: { backgroundColor: '#cbd5e1' },
  postBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  
  contentContainer: { padding: 20, paddingBottom: 40 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, marginRight: 12 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  targetTeam: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  targetText: { fontSize: 12, color: '#94a3b8' },
  teamName: { fontSize: 12, color: '#1868f0', fontWeight: '600' },
  
  input: { fontSize: 18, color: '#1e293b', lineHeight: 26, minHeight: 100, textAlignVertical: 'top', marginBottom: 20 },

  // STYLES CHO PREVIEW FILE
  previewContainer: { marginTop: 10, gap: 10 },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  previewIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  previewSize: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  removeBtn: { padding: 4 },

  // STYLES CHO THANH CÔNG CỤ CHỌN FILE
  toolbar: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff'
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  toolbarText: {
    fontSize: 15,
    color: '#1868f0',
    fontWeight: '500'
  }
});