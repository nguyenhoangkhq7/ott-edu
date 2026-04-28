import React, { useState, useMemo } from 'react';
import {
  View, Text, Modal, TouchableOpacity, FlatList,
  TextInput, Image, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation, Message } from '../types';
import { sendMessage } from '../chatApi';

interface ForwardMessageModalProps {
  visible: boolean;
  message: Message | null;
  conversations: Conversation[];
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  visible,
  message,
  conversations,
  currentUserId,
  onClose,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setSelectedIds(new Set());
      setIsSending(false);
    }
  }, [visible]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (!searchQuery) return true;
      const lowerQ = searchQuery.toLowerCase();
      const isPrivate = c.type === 'private';
      const other = isPrivate
        ? c.participants.find(p => p.id !== currentUserId)
        : null;
      
      const nameMatch = c.name?.toLowerCase().includes(lowerQ);
      const otherMatch = other?.name?.toLowerCase().includes(lowerQ);
      const codeMatch = other?.code?.toLowerCase().includes(lowerQ);

      return nameMatch || otherMatch || codeMatch;
    });
  }, [conversations, searchQuery, currentUserId]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleForward = async () => {
    if (!message || selectedIds.size === 0 || isSending) return;
    setIsSending(true);

    try {
      await Promise.all(
        Array.from(selectedIds).map((convId) => {
          const conv = conversations.find(c => c.id === convId);
          if (!conv) return Promise.resolve();

          return sendMessage(
            message.content,
            undefined, // receiverId
            conv.id,   // conversationId
            message.attachments,
            undefined, // replyTo
            true       // isForwarded
          );
        })
      );
      onSuccess();
    } catch (error) {
      console.error('Error forwarding message:', error);
      // alert or toast normally handled in parent/global
    } finally {
      setIsSending(false);
      onClose();
    }
  };

  const renderItem = ({ item: conv }: { item: Conversation }) => {
    const isPrivate = conv.type === 'private';
    const other = isPrivate
      ? conv.participants.find((p) => p.id !== currentUserId)
      : null;

    const displayName = conv.name || (isPrivate ? other?.name : 'Nhóm');
    const displayAvatar = conv.avatarUrl || 
      (isPrivate ? other?.avatarUrl : 'https://i.pravatar.cc/150?img=30');

    const isSelected = selectedIds.has(conv.id);

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => toggleSelection(conv.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
        </View>
        <Image source={{ uri: displayAvatar }} style={styles.avatar} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{displayName}</Text>
          {isPrivate && other?.code && (
            <Text style={styles.itemSub} numberOfLines={1}>{other.code}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.title}>Chuyển tiếp</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* List */}
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Không có cuộc trò chuyện nào.</Text>
            }
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerInfo}>
              {selectedIds.size > 0 
                ? `Đã chọn ${selectedIds.size}` 
                : 'Thêm người nhận'}
            </Text>
            <TouchableOpacity 
              style={[styles.sendBtn, (selectedIds.size === 0 || isSending) && styles.sendBtnDisabled]}
              onPress={handleForward}
              disabled={selectedIds.size === 0 || isSending}
            >
              {isSending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendBtnText}>Gửi</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    height: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    margin: 16,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1E293B',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  itemSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#fff',
  },
  footerInfo: {
    fontSize: 15,
    color: '#64748B',
  },
  sendBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
