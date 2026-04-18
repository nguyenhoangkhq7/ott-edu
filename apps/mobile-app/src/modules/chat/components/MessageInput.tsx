import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Message, Attachment } from '../types';
import { uploadFileToChatService } from '../chatApi';

const EMOJIS = ['😀', '😄', '😁', '😂', '😊', '😍', '😘', '👍', '👏', '🔥', '❤️', '🎉', '😅', '🤔', '😎', '🥺'];

interface MessageInputProps {
  onSend: (text: string, attachments?: Attachment[], replyToId?: string) => Promise<void>;
  replyingTo: Message | null;
  onCancelReply: () => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  replyingTo,
  onCancelReply,
  disabled,
}) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !isSending && !isUploading && !disabled;

  const handleSend = async () => {
    if (!canSend) return;
    try {
      setIsSending(true);
      await onSend(text.trim(), attachments.length > 0 ? attachments : undefined, replyingTo?.id);
      setText('');
      setAttachments([]);
      if (replyingTo) onCancelReply();
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      setIsUploading(true);
      const uploaded: Attachment[] = [];

      for (const asset of result.assets) {
        if (asset.size && asset.size > 20 * 1024 * 1024) {
          Alert.alert('File quá lớn', `"${asset.name}" vượt quá giới hạn 20MB.`);
          continue;
        }
        try {
          const { fileUrl } = await uploadFileToChatService(
            asset.uri,
            asset.name,
            asset.mimeType || 'application/octet-stream'
          );
          uploaded.push({ url: fileUrl, fileName: asset.name, fileType: asset.mimeType || '' });
        } catch (_err) {
          Alert.alert('Lỗi upload', `Không thể tải lên "${asset.name}".`);
        }
      }

      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error('File picker error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
  };

  return (
    <View style={styles.container}>
      {/* Reply preview */}
      {replyingTo && (
        <View style={styles.replyBar}>
          <Ionicons name="arrow-undo-outline" size={14} color="#3b82f6" style={{ marginRight: 6 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.replyLabel}>Đang trả lời</Text>
            <Text style={styles.replyContent} numberOfLines={1}>
              {replyingTo.isRevoked ? 'Tin nhắn đã bị thu hồi' : replyingTo.content}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply}>
            <Ionicons name="close" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      )}

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.attachmentBar}
          contentContainerStyle={{ paddingHorizontal: 8, alignItems: 'center' }}
        >
          {attachments.map((att, i) => (
            <View key={i} style={styles.attachChip}>
              <Text style={styles.attachChipText} numberOfLines={1}>📎 {att.fileName}</Text>
              <TouchableOpacity onPress={() => removeAttachment(i)} style={styles.attachRemove}>
                <Ionicons name="close" size={13} color="#64748b" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Emoji picker modal */}
      <Modal transparent visible={showEmoji} animationType="slide" onRequestClose={() => setShowEmoji(false)}>
        <Pressable style={styles.emojiOverlay} onPress={() => setShowEmoji(false)}>
          <View style={styles.emojiPanel}>
            <Text style={styles.emojiPanelTitle}>Chọn emoji</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((e) => (
                <TouchableOpacity key={e} style={styles.emojiItem} onPress={() => insertEmoji(e)}>
                  <Text style={styles.emojiItemText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Input row */}
      <View style={styles.inputRow}>
        {/* Attach file */}
        <TouchableOpacity style={styles.iconBtn} onPress={handlePickFile} disabled={isUploading || disabled}>
          {isUploading
            ? <ActivityIndicator size={20} color="#64748b" />
            : <Ionicons name="attach" size={22} color="#64748b" />}
        </TouchableOpacity>

        {/* Text + emoji */}
        <View style={styles.textBox}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#94a3b8"
            multiline
            style={styles.textInput}
            editable={!disabled && !isUploading}
          />
          <TouchableOpacity onPress={() => setShowEmoji(true)} style={styles.emojiBtn}>
            <Ionicons name="happy-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Send */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnDisabled]}
        >
          {isSending
            ? <ActivityIndicator size={16} color="#fff" />
            : <Ionicons name="send" size={17} color={canSend ? '#fff' : '#94a3b8'} style={{ marginLeft: 2 }} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#bfdbfe',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  replyLabel: { fontSize: 10, color: '#3b82f6', fontWeight: '700', marginBottom: 1 },
  replyContent: { fontSize: 13, color: '#334155' },

  attachmentBar: {
    maxHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
  },
  attachChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    maxWidth: 160,
  },
  attachChipText: { fontSize: 12, color: '#334155', flex: 1 },
  attachRemove: { marginLeft: 4 },

  emojiOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  emojiPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  emojiPanelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  emojiItem: { padding: 10 },
  emojiItemText: { fontSize: 28 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  iconBtn: { padding: 8, marginRight: 2 },
  textBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f1f5f9',
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 6,
    minHeight: 42,
    maxHeight: 110,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 9,
    lineHeight: 20,
  },
  emojiBtn: { padding: 6, marginBottom: 3 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  sendBtnActive: { backgroundColor: '#2563eb' },
  sendBtnDisabled: { backgroundColor: '#e2e8f0' },
});
