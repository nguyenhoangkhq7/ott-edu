import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Modal, Pressable, ActivityIndicator, Alert, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Message, Attachment } from '../types';
import { uploadFileToChatService } from '../chatApi';

const EMOJIS = ['😀', '😄', '🥰', '😂', '😅', '🤔', '😎', '🥺', '👍', '👏', '🔥', '❤️', '🎉', '💯', '🙏', '✨'];

interface MessageInputProps {
  onSend: (text: string, attachments?: Attachment[], replyToId?: string) => Promise<void>;
  replyingTo: Message | null;
  onCancelReply: () => void;
  disabled?: boolean;
  onTyping?: (isTyping: boolean) => void;
  isReadOnly?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend, replyingTo, onCancelReply, disabled, onTyping, isReadOnly,
}) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  
 const typingTimeoutRef = React.useRef<any>(null);

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !isSending && !isUploading && !disabled;

  const handleTextChange = (val: string) => {
    setText(val);
    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      // Debounce typing indicator to prevent socket flooding (1.5 seconds per requirement)
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1500);
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    try {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        if (onTyping) onTyping(false);
      }
      setIsSending(true);
      await onSend(text.trim(), attachments.length > 0 ? attachments : undefined, replyingTo?.id);
      setText('');
      setAttachments([]);
      if (replyingTo) onCancelReply();
    } catch (err) {
      console.error('Send error:', err);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePickFile = async (type: string = '*/*') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: type, multiple: true, copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      setIsUploading(true);
      const uploaded: Attachment[] = [];

      for (const asset of result.assets) {
        if (asset.size && asset.size > 50 * 1024 * 1024) {
          Alert.alert('File quá lớn', `"${asset.name}" vượt quá 50MB.`);
          continue;
        }
        try {
          const { fileUrl } = await uploadFileToChatService(
            asset.uri, asset.name, asset.mimeType || 'application/octet-stream'
          );
          uploaded.push({ url: fileUrl, fileName: asset.name, fileType: asset.mimeType || '' });
        } catch {
          Alert.alert('Lỗi upload', `Không thể tải lên "${asset.name}".`);
        }
      }
      setAttachments((p) => [...p, ...uploaded]);
    } catch (err) {
      console.error('File picker error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  if (isReadOnly) {
    return (
      <View style={styles.readOnlyContainer}>
        <Ionicons name="lock-closed-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
        <Text style={styles.readOnlyText}>
          Chỉ Trưởng nhóm và Phó nhóm mới có quyền gửi tin nhắn trong nhóm này.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Reply bar */}
      {replyingTo && (
        <View style={styles.replyBar}>
          <View style={styles.replyIndicator} />
          <View style={styles.replyInfo}>
            <Text style={styles.replyLabel}>Đang trả lời</Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {replyingTo.isRevoked ? '🚫 Tin nhắn đã bị thu hồi' : replyingTo.content}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.closeBtn}>
            <Ionicons name="close" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      )}

      {/* Attachments strip */}
      {attachments.length > 0 && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.attachmentScroll}
          contentContainerStyle={styles.attachmentContent}
        >
          {attachments.map((a, i) => (
            <View key={i} style={styles.attachmentItem}>
              <Text style={styles.attachmentName} numberOfLines={1}>
                {a.fileType.startsWith('image/') ? '🖼️' : a.fileType.startsWith('video/') ? '🎬' : '📎'} {a.fileName}
              </Text>
              <TouchableOpacity onPress={() => setAttachments((p) => p.filter((_, j) => j !== i))}>
                <Ionicons name="close-circle" size={15} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Emoji modal */}
      <Modal transparent visible={showEmoji} animationType="slide" onRequestClose={() => setShowEmoji(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowEmoji(false)}>
          <Pressable style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Biểu cảm</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={styles.emojiItem}
                  onPress={() => { setText((p) => p + e); setShowEmoji(false); }}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Main input row */}
      <View style={styles.inputRow}>
        {/* Attach File */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handlePickFile()}
          disabled={isUploading || disabled}
        >
          {isUploading
            ? <ActivityIndicator size={20} color="#3B82F6" />
            : <Ionicons name="attach" size={24} color="#64748B" />}
        </TouchableOpacity>

        {/* Text box */}
        <View style={styles.inputBox}>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={handleTextChange}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#94A3B8"
            multiline
            editable={!disabled && !isUploading}
          />
          <TouchableOpacity
            style={styles.emojiToggle}
            onPress={() => setShowEmoji(true)}
          >
            <Ionicons name="happy-outline" size={22} color={showEmoji ? '#3B82F6' : '#94A3B8'} />
          </TouchableOpacity>
        </View>

        {/* Send */}
        <TouchableOpacity
          style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!canSend}
        >
          {isSending
            ? <ActivityIndicator size={16} color="#FFF" />
            : <Ionicons name="send" size={18} color={canSend ? '#FFF' : '#CBD5E1'} style={{ marginLeft: 2 }} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  replyIndicator: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: '#3B82F6',
    marginRight: 10,
  },
  replyInfo: { flex: 1 },
  replyLabel: { fontSize: 10, fontWeight: '700', color: '#3B82F6', marginBottom: 2 },
  replyText: { fontSize: 12, color: '#64748B' },
  closeBtn: { padding: 4 },
  attachmentScroll: { maxHeight: 44 },
  attachmentContent: { paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    maxWidth: 160,
  },
  attachmentName: { fontSize: 12, color: '#1E40AF', flex: 1, marginRight: 4 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    paddingTop: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emojiItem: {
    width: '12.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 28 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 6,
    minHeight: 42,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 10,
    lineHeight: 20,
  },
  emojiToggle: {
    padding: 8,
    marginBottom: 1,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnActive: { backgroundColor: '#2563EB' },
  sendBtnDisabled: { backgroundColor: '#F1F5F9' },
  readOnlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  readOnlyText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
});
