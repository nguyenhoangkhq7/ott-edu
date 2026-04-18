import React from 'react';
import {
  View, Text, TextInput, ScrollView, ActivityIndicator,
  TouchableOpacity, Image, StyleSheet,
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
  currentMode, onModeChange, searchQuery, onSearchQueryChange,
  conversations, suggestedUsers, currentUser, activeConversationId,
  onSelectConversation, onStartPrivateChat, isLoading, error,
}) => {
  const filtered = conversations.filter((c) => {
    if (c.type !== currentMode) return false;
    if (!searchQuery) return true;
    return (c.name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
  });

  const totalUnread = conversations
    .filter((c) => c.type === currentMode)
    .reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tin nhắn</Text>
          {totalUnread > 0 && (
            <Text style={styles.unreadHint}>{totalUnread} chưa đọc</Text>
          )}
        </View>
        <TouchableOpacity style={styles.composeBtn}>
          <Ionicons name="create-outline" size={22} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={onSearchQueryChange}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchQueryChange('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Tab Toggle ── */}
      <View style={styles.tabWrap}>
        {(['private', 'class'] as ChatMode[]).map((mode) => {
          const active = currentMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => onModeChange(mode)}
            >
              <Ionicons
                name={mode === 'private'
                  ? (active ? 'chatbubble' : 'chatbubble-outline')
                  : (active ? 'people' : 'people-outline')}
                size={14}
                color={active ? '#2563EB' : '#64748B'}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {'  '}{mode === 'private' ? 'Cá nhân' : 'Nhóm học'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : (
          <>
            {/* Suggested users */}
            {searchQuery.length > 0 && suggestedUsers.length > 0 && currentMode === 'private' && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>LIÊN HỆ GỢI Ý</Text>
                {suggestedUsers.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    style={styles.suggestRow}
                    onPress={() => onStartPrivateChat(u)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: u.avatarUrl || `https://i.pravatar.cc/150?u=${u.id}` }}
                      style={styles.suggestAvatar}
                    />
                    <View style={styles.suggestInfo}>
                      <Text style={styles.suggestName}>{u.name}</Text>
                      {u.code && <Text style={styles.suggestCode}>{u.code}</Text>}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Conversation list */}
            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons
                    name={currentMode === 'private' ? 'chatbubbles-outline' : 'people-outline'}
                    size={40}
                    color="#93C5FD"
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'Không tìm thấy kết quả' : `Chưa có ${currentMode === 'private' ? 'tin nhắn' : 'nhóm học'} nào`}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'Thử tìm với từ khóa khác'
                    : currentMode === 'private'
                      ? 'Tìm kiếm để bắt đầu trò chuyện'
                      : 'Các nhóm lớp học sẽ xuất hiện ở đây'}
                </Text>
              </View>
            ) : (
              <>
                {!searchQuery && (
                  <Text style={[styles.sectionLabel, { marginTop: 8, marginBottom: 4 }]}>
                    {filtered.length} CUỘC TRÒ CHUYỆN
                  </Text>
                )}
                {filtered.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    currentUser={currentUser}
                    isActive={activeConversationId === conv.id}
                    onSelect={onSelectConversation}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  unreadHint: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 2,
  },
  composeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchWrap: { paddingHorizontal: 16, marginBottom: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    paddingVertical: 0,
    marginHorizontal: 8,
  },

  tabWrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  tabTextActive: { color: '#2563EB', fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  section: { marginBottom: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    backgroundColor: '#FFF1F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  errorText: { fontSize: 13, color: '#DC2626', marginLeft: 8, flex: 1 },

  center: { alignItems: 'center', paddingTop: 60 },
  loadingText: { marginTop: 12, fontSize: 13, color: '#94A3B8' },

  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  suggestAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0' },
  suggestInfo: { flex: 1, marginLeft: 12 },
  suggestName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  suggestCode: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  emptyState: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16, fontWeight: '700', color: '#334155',
    textAlign: 'center', marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20,
  },
});
