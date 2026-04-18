import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMode, Conversation, User } from '../types';
import { ConversationItem } from './ConversationItem';

interface SidebarProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  conversations: Conversation[];
  suggestedUsers: User[];
  currentUser: User | null;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onStartPrivateChat: (user: User) => void;
  isLoading: boolean;
  error: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onModeChange,
  searchQuery,
  onSearchQueryChange,
  conversations,
  suggestedUsers,
  currentUser,
  activeConversationId,
  onSelectConversation,
  onStartPrivateChat,
  isLoading,
  error,
}) => {
  const filteredConversations = conversations.filter((c) => {
    if (c.type !== currentMode) return false;
    if (!searchQuery) return true;
    return (c.name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            style={styles.searchInput}
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchQueryChange('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab toggle */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, currentMode === 'private' && styles.tabBtnActive]}
            onPress={() => onModeChange('private')}
          >
            <Ionicons
              name={currentMode === 'private' ? 'person' : 'person-outline'}
              size={15}
              color={currentMode === 'private' ? '#2563eb' : '#64748b'}
            />
            <Text style={[styles.tabBtnText, currentMode === 'private' && styles.tabBtnTextActive]}>
              {'  '}Cá nhân
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, currentMode === 'class' && styles.tabBtnActive]}
            onPress={() => onModeChange('class')}
          >
            <Ionicons
              name={currentMode === 'class' ? 'people' : 'people-outline'}
              size={15}
              color={currentMode === 'class' ? '#2563eb' : '#64748b'}
            />
            <Text style={[styles.tabBtnText, currentMode === 'class' && styles.tabBtnTextActive]}>
              {'  '}Nhóm học
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Loading */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 48 }} />
        ) : (
          <>
            {/* Suggested users when searching */}
            {searchQuery.length > 0 && suggestedUsers.length > 0 && currentMode === 'private' && (
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.sectionLabel}>GỢI Ý LIÊN HỆ</Text>
                {suggestedUsers.map((user) => (
                  <TouchableOpacity
                    key={`suggest-${user.id}`}
                    style={styles.suggestRow}
                    onPress={() => onStartPrivateChat(user)}
                  >
                    <Image
                      source={{ uri: user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}` }}
                      style={styles.suggestAvatar}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.suggestName}>{user.name}</Text>
                      {user.code ? <Text style={styles.suggestCode}>{user.code}</Text> : null}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Empty state */}
            {filteredConversations.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="chatbubbles-outline" size={36} color="#93c5fd" />
                </View>
                <Text style={styles.emptyTitle}>
                  Chưa có {currentMode === 'private' ? 'tin nhắn' : 'nhóm học'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {currentMode === 'private'
                    ? 'Tìm kiếm người dùng để bắt đầu chat'
                    : 'Các nhóm lớp học sẽ xuất hiện ở đây'}
                </Text>
              </View>
            )}

            {/* Conversation list */}
            {filteredConversations.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>
                  {filteredConversations.length} cuộc trò chuyện
                </Text>
                {filteredConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    currentUser={currentUser}
                    isActive={activeConversationId === conv.id}
                    onSelect={onSelectConversation}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  searchSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1e293b',
    paddingVertical: 0,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },
  errorBox: {
    margin: 8,
    padding: 12,
    backgroundColor: '#fff1f2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  errorText: {
    color: '#be123c',
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  suggestAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e2e8f0',
  },
  suggestName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  suggestCode: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 19,
  },
});
