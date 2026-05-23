import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import PostList from '../components/PostList';
import CreatePost from '../PostForm';
import CommentBottomSheet from '../components/CommentBottomSheet';
import CreatePostFAB from '../components/CreatePostFAB';
import { usePostRealtime, Post } from '@/shared/hooks/usePostRealtime';

interface PostsTabProps {
  teamTitle?: string;
  classId: string;
}

export default function PostsTab({ teamTitle = 'Your Class', classId }: PostsTabProps) {
  const [isPosting, setIsPosting] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  
  const { deletePost } = usePostRealtime(classId);

  // Xử lý Xóa
  const handleDelete = (postId: string) => {
    Alert.alert("Xóa bài viết", "Bạn có chắc chắn muốn xóa bài viết này?", [
      { text: "Hủy", style: "cancel" },
      { 
        text: "Xóa", 
        style: "destructive", 
        onPress: async () => {
          try {
            await deletePost(postId);
          } catch (error) {
            Alert.alert("Lỗi", "Không thể xóa bài viết.");
          }
        } 
      }
    ]);
  };

  // Xử lý Sửa: Mở form và truyền bài viết vào
  const handleEdit = (post: Post) => {
    setPostToEdit(post);
    setIsPosting(true);
  };

  const closeForm = () => {
    setIsPosting(false);
    setPostToEdit(null);
  };

  if (isPosting) {
    return (
      <CreatePost
        teamTitle={teamTitle}
        classId={classId}
        postToEdit={postToEdit} // Truyền bài viết cần sửa vào form
        onBack={closeForm}
      />
    );
  }

  return (
    <View style={styles.container}>
      <PostList
        classId={classId}
        onOpenComments={(postId: string) => setSelectedPostId(postId)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CommentBottomSheet
        postId={selectedPostId}
        visible={!!selectedPostId}
        onClose={() => setSelectedPostId(null)}
      />

      <CreatePostFAB
        onPress={() => setIsPosting(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});