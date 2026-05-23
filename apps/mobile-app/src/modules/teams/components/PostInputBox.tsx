import React from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  Text,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PostInputBoxProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onAttach?: () => void;
  onSend: () => Promise<void> | void;
  isSubmitting?: boolean;
  replyToName?: string | null;
  onCancelReply?: () => void;
  // Bổ sung props nhận file đính kèm
  attachments?: any[];
  onRemoveAttachment?: (index: number) => void;
}

// Helper kiểm tra xem file có phải là ảnh không để hiển thị thumbnail
const isImage = (mimeType?: string) => {
  return mimeType?.startsWith('image/') ?? false;
};

export default function PostInputBox({ 
  placeholder = 'Write a comment...', 
  value, 
  onChangeText, 
  onAttach, 
  onSend, 
  isSubmitting = false, 
  replyToName = null, 
  onCancelReply,
  attachments = [],
  onRemoveAttachment
}: PostInputBoxProps) {
  
  // Nút Send sẽ sáng lên nếu có gõ chữ HOẶC có chọn file
  const canSend = value.trim().length > 0 || attachments.length > 0;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={styles.container}>
        
        {/* TRẠNG THÁI ĐANG REPLY HOẶC EDIT */}
        {replyToName && (
          <View style={styles.replyBadge}>
            <Text style={styles.replyText}>
              {replyToName === "Editing..." ? "Editing comment" : "Replying to "} 
              {replyToName !== "Editing..." && <Text style={{fontWeight: '700'}}>{replyToName}</Text>}
            </Text>
            <TouchableOpacity onPress={onCancelReply} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        )}

        {/* DANH SÁCH PREVIEW FILE ĐÍNH KÈM */}
        {attachments.length > 0 && (
          <View style={styles.previewContainer}>
            {attachments.map((file, index) => (
              <View key={index} style={styles.previewItem}>
                {isImage(file.mimeType) ? (
                  <Image source={{ uri: file.uri }} style={styles.previewThumb} />
                ) : (
                  <View style={styles.previewIconBox}>
                    <Ionicons name="document-text" size={20} color="#64748b" />
                  </View>
                )}
                
                <View style={styles.previewTextContainer}>
                  <Text numberOfLines={1} style={styles.previewText}>{file.name}</Text>
                  <Text style={styles.previewSize}>
                    {file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'Unknown size'}
                  </Text>
                </View>

                <TouchableOpacity 
                  onPress={() => onRemoveAttachment?.(index)} 
                  style={styles.removeBtn}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                  <Ionicons name="close-circle" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Ô NHẬP LIỆU CHÍNH */}
        <View style={styles.row}>
          <TouchableOpacity onPress={onAttach} style={styles.attachBtn} disabled={isSubmitting}>
            <Ionicons name="attach-outline" size={26} color="#64748b" />
          </TouchableOpacity>
          
          <View style={styles.inputWrap}>
            <TextInput
              placeholder={placeholder}
              placeholderTextColor="#94a3b8"
              value={value}
              onChangeText={onChangeText}
              multiline
              style={styles.input}
              editable={!isSubmitting}
            />
          </View>
          
          <TouchableOpacity 
            onPress={onSend} 
            disabled={!canSend || isSubmitting} 
            style={styles.sendBtn}
          >
            {isSubmitting ? (
              <ActivityIndicator size={18} color="#4f46e5" />
            ) : (
              <Ionicons name="send" size={22} color={canSend ? '#4f46e5' : '#cbd5e1'} />
            )}
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    backgroundColor: '#fff', 
    padding: 10, 
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9' 
  },
  replyBadge: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#f8fafc', 
    paddingHorizontal: 10, 
    paddingVertical: 8,
    borderRadius: 8, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  replyText: { 
    color: '#64748b',
    fontSize: 13,
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    gap: 8 
  },
  attachBtn: { 
    padding: 6,
    marginBottom: 2
  },
  inputWrap: { 
    flex: 1, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 20, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    maxHeight: 140,
    minHeight: 40,
    justifyContent: 'center'
  },
  input: { 
    color: '#1e293b', 
    fontSize: 14, 
    maxHeight: 120,
    paddingTop: 0,
    paddingBottom: 0
  },
  sendBtn: { 
    padding: 6,
    marginBottom: 2
  },

  // STYLES CHO PREVIEW KHUNG FILE ĐÍNH KÈM
  previewContainer: {
    marginBottom: 8,
    gap: 6,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  previewIconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTextContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
    justifyContent: 'center',
  },
  previewText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  previewSize: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  removeBtn: {
    padding: 4,
  }
});