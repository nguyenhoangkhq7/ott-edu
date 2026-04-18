import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../types';

interface MessageInputProps {
  onSend: (text: string, files?: null, replyToId?: string) => Promise<void>;
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

  const handleSend = async () => {
    if (!text.trim() || isSending || disabled) return;
    try {
      setIsSending(true);
      await onSend(text.trim(), null, replyingTo?.id);
      setText('');
      if (replyingTo) onCancelReply();
    } catch (error) {
      console.error('Lỗi khi gửi:', error);
    } finally {
      setIsSending(false);
    }
  };

  const canSend = !!text.trim() && !isSending && !disabled;

  return (
    <View style={styles.container}>
      {/* Reply preview */}
      {replyingTo && (
        <View style={styles.replyBar}>
          <Ionicons name="arrow-undo-outline" size={14} color="#64748b" style={{ marginRight: 6 }} />
          <Text style={styles.replyText} numberOfLines={1}>
            Trả lời: {replyingTo.isRevoked ? 'Tin nhắn đã thu hồi' : replyingTo.content}
          </Text>
          <TouchableOpacity onPress={onCancelReply} style={{ marginLeft: 8 }}>
            <Ionicons name="close" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.attachBtn} disabled={disabled}>
          <Ionicons name="attach" size={22} color="#64748b" />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#94a3b8"
            multiline
            style={styles.textInput}
            editable={!disabled}
          />
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnDisabled]}
        >
          <Ionicons name="send" size={16} color={canSend ? '#fff' : '#94a3b8'} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  replyText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  attachBtn: {
    padding: 8,
    marginRight: 4,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    color: '#1e293b',
    paddingVertical: 8,
    lineHeight: 20,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnActive: {
    backgroundColor: '#2563eb',
  },
  sendBtnDisabled: {
    backgroundColor: '#e2e8f0',
  },
});
