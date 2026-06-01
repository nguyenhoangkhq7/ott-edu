import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, ActivityIndicator,
  TouchableOpacity, Image, StyleSheet,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ChatMode, Conversation, User } from '../types';
import { ConversationItem } from './ConversationItem';
import { useAuth } from '../../auth/AuthProvider';
import { fetchFriendRequests } from '../../friends/friends.api';
// 🚀 IMPORT VŨ KHÍ TÌM KIẾM VÀO ĐÂY
import { useUserSearch } from '../../../shared/hooks/useUserSearch';

interface SidebarProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  conversations: Conversation[];
  suggestedUsers: User[]; // Giữ nguyên prop này để không lỗi Component cha, nhưng mình sẽ xài data từ Hook
  currentUser: User | null;
  currentUserId?: string;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onStartPrivateChat: (user: any) => void; // Cho phép nhận any để tương thích với ApiUser
  isLoading: boolean;
  error: string | null;
  socket: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode, onModeChange, searchQuery, onSearchQueryChange,
  conversations, currentUser, currentUserId, activeConversationId,
  onSelectConversation, onStartPrivateChat, isLoading, error, socket,
}) => {
  const router = useRouter();

  // 👇 --- LOGIC REALTIME CHO CHẤM ĐỎ (SỬA LẠI ĐÚNG CẤU TRÚC) --- 👇
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [searchTrigger, setSearchTrigger] = useState(0);

  const identity = useMemo(() => {
    if (!user) return null;
    return {
      email: user.email || "",
      code: user.code ?? undefined,
      id: (user as any)?._id || (user as any)?.mongoId || (user as any)?.id || ""
    };
  }, [user]);

  // 1. Hàm này lấy dữ liệu từ API - Phải nằm độc lập để gọi được ở mọi nơi
  const loadPendingCount = useCallback(async () => {
    if (!identity) return;
    try {
      const reqs = await fetchFriendRequests(identity);
      setPendingCount(reqs?.length || 0);
    } catch (err) {
      console.error("Lỗi tải lời mời:", err);
    }
  }, [identity]);

  // 2. Chạy lần đầu khi mount
  useEffect(() => {
    loadPendingCount();
  }, [loadPendingCount]);



  // 4. Lắng nghe event nội bộ
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SYNC_FRIENDS_DATA', () => {
      loadPendingCount();
      setSearchTrigger((prev) => prev + 1);
    });
    return () => subscription.remove();
  }, [loadPendingCount]);
  // 👆 --- KẾT THÚC LOGIC CHẤM ĐỎ --- 👆

  // 🚀 --- TÍCH HỢP HOOK TÌM KIẾM --- 🚀
  // Gọi hook ra, chỉ kích hoạt khi đang ở tab 'private' để đỡ tốn API
  const { setKeyword, users: apiUsers, isLoading: isSearchingApi } = useUserSearch(identity, currentMode === 'private', searchTrigger);

  // Hàm xử lý khi gõ phím: Vừa cập nhật UI cha, vừa kích hoạt Hook tìm người mới
  const handleSearchInput = (text: string) => {
    onSearchQueryChange(text); // Lọc danh sách chat có sẵn
    setKeyword(text);          // Đưa vào Hook chờ Debounce 0.5s rồi gọi API
  };

  const handleClearSearch = () => {
    onSearchQueryChange('');
    setKeyword('');
  };
  // 🚀 --- KẾT THÚC LOGIC TÌM KIẾM --- 🚀

  const getFriendStatus = (u: User) => {
    const uId = u.id || (u as any)._id;
    // 1. Cross reference with existing private conversations (highly reliable and real-time updated)
    const privateConv = conversations.find(
      (c) =>
        c.type === 'private' &&
        c.participants.some((p) => p.id === uId)
    );
    if (privateConv) {
      const other = privateConv.participants.find((p) => p.id === uId);
      if (other && other.friendStatus) {
        return other.friendStatus;
      }
    }
    return u.friendStatus || 'none';
  };

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

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
            onPress={() => router.push('/(dashboard)/friends')}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons name="person-add" size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
              {pendingCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}
            onPress={() => router.push('/(dashboard)/create-group')}
          >
            <Ionicons name="create" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm hoặc kết nối người mới..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearchInput} // 👈 Đã gắn hàm xịn vào đây
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
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

            {/* Conversation list (Danh sách chat cũ) */}
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
                    currentUserId={currentUserId}
                    isActive={activeConversationId === conv.id}
                    onSelect={onSelectConversation}
                  />
                ))}
              </>
            )}

            {/* 🚀 DANH SÁCH GỢI Ý / KẾT QUẢ TÌM KIẾM TỪ API */}
            {currentMode === 'private' && (apiUsers.length > 0 || isSearchingApi) && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {searchQuery.length > 0 ? 'TÌM KIẾM NGƯỜI DÙNG MỚI' : 'GỢI Ý KẾT NỐI'}
                </Text>

                {isSearchingApi ? (
                  <ActivityIndicator size="small" color="#3B82F6" style={{ marginVertical: 10 }} />
                ) : (
                  apiUsers
                    .filter((u) => (u.id || u._id) !== identity?.id) // Lọc bỏ chính mình
                    .map((u) => (
                      <TouchableOpacity
                        key={u.id || u._id}
                        style={styles.suggestRow}
                        onPress={() => onStartPrivateChat(u)} // Bấm vào là chat luôn
                        activeOpacity={0.7}
                      >
                        <Image
                          source={{ uri: u.avatarUrl || `https://ui-avatars.com/api/?name=${u.fullName || u.name}` }}
                          style={styles.suggestAvatar}
                        />
                        <View style={styles.suggestInfo}>
                          <Text style={styles.suggestName}>{u.fullName || u.name}</Text>
                          {(u.code || u.email) && (
                            <Text style={styles.suggestCode}>{u.code || u.email}</Text>
                          )}
                        </View>
                        {(() => {
                          const status = getFriendStatus(u);
                          if (status === 'friend') {
                            return <Ionicons name="checkmark-circle" size={18} color="#10B981" />;
                          }
                          if (status === 'pending') {
                            return <Ionicons name="time-outline" size={18} color="#94A3B8" />;
                          }
                          return <Ionicons name="person-add-outline" size={18} color="#3B82F6" />;
                        })()}
                      </TouchableOpacity>
                    ))
                )}
              </View>
            )}

          </>
        )}
      </ScrollView>
    </View>
  );
};

// 🎨 CÁC STYLE CỦA ÔNG TUI GIỮ NGUYÊN 100%
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  badgeContainer: {
    position: 'absolute',
    top: -8,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
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