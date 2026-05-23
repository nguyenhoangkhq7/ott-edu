import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePostRealtime } from '@/shared/hooks/usePostRealtime';
import PostItem from './PostItem';
import type { Post, PostAttachment } from '@/shared/hooks/usePostRealtime';

interface PostListProps {
  classId: string | null;
  onOpenComments?: (postId: string) => void;
  onAttachmentPress?: (attachment: PostAttachment) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

// 1. Tách SearchBar ra ngoài để tránh bị re-create khi PostList render lại
const SearchBar = React.memo(
  ({
    searchQuery,
    onChangeText,
  }: {
    searchQuery: string;
    onChangeText: (text: string) => void;
  }) => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search posts..."
        placeholderTextColor="#94a3b8"
        value={searchQuery}
        onChangeText={onChangeText}
        // Thêm các thuộc tính này để ổn định bàn phím
        returnKeyType="done"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={18} color="#94a3b8" />
        </TouchableOpacity>
      )}
    </View>
  )
);
SearchBar.displayName = 'SearchBar';

export default function PostList({
  classId,
  onOpenComments,
  onAttachmentPress,
  onEdit,
  onDelete,
}: PostListProps) {
  const { posts, loading, fetchPosts } = usePostRealtime(classId);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 2. Dùng useCallback để giữ ổn định hàm onChangeText
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPosts();
    } finally {
      setRefreshing(false);
    }
  }, [fetchPosts]);

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const query = searchQuery.toLowerCase();
    return posts.filter(
      (post) =>
        post.content.toLowerCase().includes(query) ||
        post.authorName.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  const renderPostItem = ({ item }: { item: Post }) => (
    <PostItem
      post={item}
      onPressComment={() => onOpenComments?.(item.id)}
      onAttachmentPress={onAttachmentPress}
      onEdit={() => onEdit?.(item)}
      onDelete={() => onDelete?.(item.id)}
    />
  );

  // 3. Render header ổn định
  const renderHeader = useMemo(() => () => (
    <View style={styles.headerContainer}>
      <SearchBar searchQuery={searchQuery} onChangeText={handleSearchChange} />
      {filteredPosts.length > 0 && (
        <Text style={styles.postCountText}>
          {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
        </Text>
      )}
    </View>
  ), [filteredPosts.length, searchQuery, handleSearchChange]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1868f0" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader()}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1868f0']} tintColor="#1868f0" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  listContent: { flexGrow: 1, paddingTop: 8, paddingBottom: 16 },
  headerContainer: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 12, height: 40, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b', paddingVertical: 8 },
  postCountText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' }
});