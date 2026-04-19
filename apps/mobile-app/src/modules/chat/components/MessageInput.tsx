import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Pressable, ActivityIndicator, Alert,
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
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend, replyingTo, onCancelReply, disabled,
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
        type: '*/*', multiple: true, copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      setIsUploading(true);
      const uploaded: Attachment[] = [];

      for (const asset of result.assets) {
        if (asset.size && asset.size > 20 * 1024 * 1024) {
          Alert.alert('File quá lớn', `"${asset.name}" vượt quá 20MB.`);
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

  return (
    <View style={styles.wrapper}>
      {/* Reply bar */}
      {replyingTo && (
        <View style={styles.replyBar}>
          <View style={styles.replyAccent} />
          <View style={styles.replyBody}>
            <Text style={styles.replyLabel}>Đang trả lời</Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {replyingTo.isRevoked ? '🚫 Tin nhắn đã bị thu hồi' : replyingTo.content}
            </Text>
          </View>
          <TouchableOpacity style={styles.replyClose} onPress={onCancelReply}>
            <Ionicons name="close" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      )}

      {/* Attachments strip */}
      {attachments.length > 0 && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.attachStrip}
          contentContainerStyle={styles.attachContent}
        >
          {attachments.map((a, i) => (
            <View key={i} style={styles.attachChip}>
              <Text style={styles.attachChipTxt} numberOfLines={1}>📎 {a.fileName}</Text>
              <TouchableOpacity onPress={() => setAttachments((p) => p.filter((_, j) => j !== i))}>
                <Ionicons name="close-circle" size={15} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Emoji modal */}
      <Modal transparent visible={showEmoji} animationType="slide" onRequestClose={() => setShowEmoji(false)}>
        <Pressable style={styles.emojiOverlay} onPress={() => setShowEmoji(false)}>
          <Pressable style={styles.emojiSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.emojiSheetTitle}>Biểu cảm</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={styles.emojiCell}
                  onPress={() => { setText((p) => p + e); setShowEmoji(false); }}
                >
                  <Text style={styles.emojiCellTxt}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Main input row */}
      <View style={styles.row}>
        {/* Attach */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handlePickFile}
          disabled={isUploading || disabled}
        >
          {isUploading
            ? <ActivityIndicator size={20} color="#3B82F6" />
            : <Ionicons name="attach" size={22} color="#64748B" />}
        </TouchableOpacity>

        {/* Text box */}
        <View style={styles.inputBox}>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#94A3B8"
            multiline
            editable={!disabled && !isUploading}
          />
          <TouchableOpacity
            style={styles.emojiBtn}
            onPress={() => setShowEmoji(true)}
          >
            <Ionicons name="happy-outline" size={20} color={showEmoji ? '#3B82F6' : '#94A3B8'} />
          </TouchableOpacity>
        </View>

        {/* Send */}
        <TouchableOpacity
          style={[styles.sendBtn, canSend ? styles.sendActive : styles.sendInactive]}
          onPress={handleSend}
          disabled={!canSend}
        >
          {isSending
            ? <ActivityIndicator size={16} color="#FFF" />
            : <Ionicons name="send" size={17} color={canSend ? '#FFF' : '#CBD5E1'} style={{ marginLeft: 2 }} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },

  // Reply bar
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  replyAccent: { width: 3, alignSelf: 'stretch', backgroundColor: '#3B82F6', marginRight: 10 },
  replyBody: { flex: 1 },
  replyLabel: { fontSize: 11, fontWeight: '700', color: '#3B82F6', marginBottom: 1 },
  replyText: { fontSize: 13, color: '#475569' },
  replyClose: { padding: 4 },

  // Attachments strip
  attachStrip: { maxHeight: 44 },
  attachContent: {
    paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center',
  },
  attachChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    marginRight: 8, maxWidth: 160,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  attachChipTxt: { fontSize: 12, color: '#1D4ED8', flex: 1, marginRight: 4 },

  // Emoji modal
  emojiOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)',
  },
  emojiSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32, paddingTop: 12, paddingHorizontal: 16,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 12,
  },
  emojiSheetTitle: {
    fontSize: 13, fontWeight: '700', color: '#94A3B8',
    textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  emojiCell: {
    width: '12.5%', aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiCellTxt: { fontSize: 28 },

  // Input row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  iconBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 4,
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingLeft: 14, paddingRight: 6,
    minHeight: 42, maxHeight: 110,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 10,
    lineHeight: 20,
  },
  emojiBtn: { padding: 8, marginBottom: 2 },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  sendActive: { backgroundColor: '#2563EB' },
  sendInactive: { backgroundColor: '#F1F5F9' },
});
