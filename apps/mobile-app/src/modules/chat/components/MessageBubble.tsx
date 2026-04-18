import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message, User } from '../types';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  sender?: User;
  onReply?: (message: Message) => void;
  showAvatar?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSelf,
  sender,
  onReply,
  showAvatar = true,
}) => {
  const isRevoked = message.isRevoked;

  return (
    <View style={[styles.row, isSelf ? styles.rowRight : styles.rowLeft]}>
      {/* Avatar placeholder for alignment */}
      {!isSelf && (
        showAvatar ? (
          <Image
            source={{ uri: sender?.avatarUrl || `https://i.pravatar.cc/150?u=${message.senderId}` }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarSpacer} />
        )
      )}

      <View style={[styles.bubble, isSelf ? styles.bubbleRight : styles.bubbleLeft]}>
        {/* Sender name */}
        {!isSelf && showAvatar && (
          <Text style={styles.senderName}>{sender?.name || 'Người dùng'}</Text>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <View style={[styles.replyBox, isSelf ? styles.replyBoxSelf : styles.replyBoxOther]}>
            <Text style={[styles.replyLabel, isSelf ? styles.replyLabelSelf : styles.replyLabelOther]}>
              Đã trả lời
            </Text>
            <Text
              style={[styles.replyContent, isSelf ? styles.replyContentSelf : styles.replyContentOther]}
              numberOfLines={1}
            >
              {message.replyTo.isRevoked ? 'Tin nhắn đã thu hồi' : message.replyTo.content}
            </Text>
          </View>
        )}

        {/* Message content */}
        <View style={[styles.content, isSelf ? styles.contentSelf : styles.contentOther]}>
          <Text style={[styles.text, isSelf ? styles.textSelf : styles.textOther]}>
            {isRevoked ? (
              <Text style={styles.revokedText}>Tin nhắn đã thu hồi</Text>
            ) : message.content}
          </Text>

          {/* Attachments */}
          {!isRevoked && message.attachments && message.attachments.length > 0 && (
            <View style={{ marginTop: 8 }}>
              {message.attachments.map((file, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.attachment, isSelf ? styles.attachmentSelf : styles.attachmentOther]}
                  onPress={() => Linking.openURL(file.url)}
                >
                  <Ionicons name="document-text" size={18} color={isSelf ? '#bfdbfe' : '#64748b'} />
                  <Text
                    style={[styles.attachmentName, isSelf ? styles.attachmentNameSelf : styles.attachmentNameOther]}
                    numberOfLines={1}
                  >
                    {file.fileName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Time + Reply button */}
        <View style={[styles.footer, isSelf ? styles.footerRight : styles.footerLeft]}>
          {!isSelf && onReply && !isRevoked && (
            <TouchableOpacity onPress={() => onReply(message)} style={styles.replyBtn}>
              <Ionicons name="arrow-undo-outline" size={14} color="#94a3b8" />
            </TouchableOpacity>
          )}
          <Text style={styles.time}>{format(new Date(message.createdAt), 'HH:mm')}</Text>
          {isSelf && onReply && !isRevoked && (
            <TouchableOpacity onPress={() => onReply(message)} style={styles.replyBtn}>
              <Ionicons name="arrow-undo-outline" size={14} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  avatarSpacer: {
    width: 30,
    marginRight: 8,
  },
  bubble: {
    maxWidth: '75%',
  },
  bubbleLeft: {
    alignItems: 'flex-start',
  },
  bubbleRight: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 3,
    marginLeft: 4,
  },
  replyBox: {
    padding: 8,
    borderRadius: 10,
    marginBottom: 4,
    borderLeftWidth: 3,
  },
  replyBoxSelf: {
    backgroundColor: 'rgba(37,99,235,0.2)',
    borderLeftColor: '#93c5fd',
  },
  replyBoxOther: {
    backgroundColor: 'rgba(148,163,184,0.15)',
    borderLeftColor: '#cbd5e1',
  },
  replyLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyLabelSelf: { color: '#bfdbfe' },
  replyLabelOther: { color: '#475569' },
  replyContent: { fontSize: 12 },
  replyContentSelf: { color: '#e0f2fe' },
  replyContentOther: { color: '#475569' },
  content: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  contentSelf: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  contentOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  textSelf: { color: '#fff' },
  textOther: { color: '#1e293b' },
  revokedText: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  attachmentSelf: { backgroundColor: 'rgba(37,99,235,0.4)' },
  attachmentOther: { backgroundColor: '#f1f5f9' },
  attachmentName: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginLeft: 6,
  },
  attachmentNameSelf: { color: '#bfdbfe' },
  attachmentNameOther: { color: '#475569' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    paddingHorizontal: 4,
  },
  footerLeft: { justifyContent: 'flex-start' },
  footerRight: { justifyContent: 'flex-end' },
  time: {
    fontSize: 10,
    color: '#94a3b8',
    marginHorizontal: 4,
  },
  replyBtn: {
    padding: 2,
  },
});
