import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, 
  TextInput, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CreatePost from '../CreatePost'; // Import màn hình tạo bài đăng

interface PostsTabProps {
  teamTitle?: string; // Tên lớp học truyền từ màn hình cha
}

// DỮ LIỆU ĐÃ ĐƯỢC ĐỔI: replies chính -> comments, nestedReplies -> replies
const POSTS_DATA = [
  {
    id: '1',
    author: 'Dr. Aris Thorne',
    avatar: 'https://i.pravatar.cc/150?u=aris',
    time: 'Yesterday at 10:45 AM',
    title: 'Welcome to Advanced Mathematics!',
    content: 'Hello everyone! I am excited to start this semester with you all. Please download the syllabus below.',
    attachment: { name: 'Course_Syllabus_Fall2024.pdf', size: '2.4 MB', type: 'PDF' },
    likes: 12,
    comments: [
      { 
        id: 'c1', 
        author: 'Tran Hau', 
        avatar: 'https://i.pravatar.cc/150?u=hau', 
        content: 'Em chào thầy ạ! Tài liệu rất bổ ích.', 
        time: '2h ago',
        likes: 2,
        isLiked: true,
        replies: [
          { id: 'r1', author: 'Dr. Aris Thorne', content: 'Chào Hậu nhé, cố gắng học tập tốt!', time: '1h ago' }
        ]
      },
    ]
  }
];

export default function PostsTab({ teamTitle = "Your Class" }: PostsTabProps) {
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({ '1': true });
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{name: string, id: string} | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const handleReply = (authorName: string, replyId: string) => {
    setReplyingTo({ name: authorName, id: replyId });
    inputRef.current?.focus();
  };

  // NẾU ĐANG TẠO BÀI ĐĂNG -> HIỆN MÀN HÌNH SOẠN THẢO
  if (isPosting) {
    return <CreatePost teamTitle={teamTitle} onBack={() => setIsPosting(false)} />;
  }

  const renderPost = ({ item }: { item: typeof POSTS_DATA[0] }) => {
    const isExpanded = expandedPosts[item.id];

    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Image source={{ uri: item.avatar }} style={styles.postAvatar} />
          <View style={styles.postHeaderText}>
            <Text style={styles.postAuthor}>{item.author}</Text>
            <Text style={styles.postTime}>{item.time}</Text>
          </View>
          <TouchableOpacity><Ionicons name="ellipsis-horizontal" size={20} color="#94a3b8" /></TouchableOpacity>
        </View>

        {/* Content */}
        {item.title && <Text style={styles.postTitle}>{item.title}</Text>}
        <Text style={styles.postContentText}>{item.content}</Text>

        {/* Attachment Box */}
        {item.attachment && (
          <View style={styles.attachmentBox}>
            <MaterialCommunityIcons name="file-pdf-box" size={32} color="#ef4444" style={{marginRight: 10}} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fileName}>{item.attachment.name}</Text>
              <Text style={styles.fileSize}>{item.attachment.size} • {item.attachment.type}</Text>
            </View>
            <Ionicons name="download-outline" size={22} color="#64748b" />
          </View>
        )}

        {/* Post Footer Interaction */}
        <View style={styles.postFooter}>
          <TouchableOpacity style={styles.interactionBtn}>
            <MaterialCommunityIcons name="thumb-up" size={18} color="#1868f0" />
            <Text style={[styles.interactionText, {color: '#1868f0'}]}>{item.likes}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.interactionBtn} 
            onPress={() => setExpandedPosts(p => ({...p, [item.id]: !p[item.id]}))}
          >
            <Ionicons name="chatbubble-outline" size={20} color={isExpanded ? "#4f46e5" : "#64748b"} />
            {/* Đã sửa thành Comments */}
            <Text style={[styles.interactionText, isExpanded && {color: '#4f46e5'}]}>
              {item.comments.length} {item.comments.length > 1 ? 'Comments' : 'Comment'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- COMMENTS SECTION --- */}
        {isExpanded && (
          <View style={styles.commentsContainer}>
            {item.comments.map(comment => (
              <View key={comment.id} style={{marginBottom: 15}}>
                <View style={styles.commentItem}>
                  <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
                  <View style={{flex: 1}}>
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentAuthor}>{comment.author}</Text>
                      <Text style={styles.commentContent}>{comment.content}</Text>
                    </View>
                    
                    <View style={styles.commentActionRow}>
                      <Text style={styles.commentTime}>{comment.time}</Text>
                      <TouchableOpacity><Text style={[styles.actionText, comment.isLiked && {color: '#1868f0'}]}>Like</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleReply(comment.author, comment.id)}><Text style={styles.actionText}>Reply</Text></TouchableOpacity>
                    </View>

                    {/* --- NESTED REPLIES (Tầng 2) --- */}
                    {comment.replies?.map(reply => (
                      <View key={reply.id} style={[styles.commentItem, {marginTop: 10}]}>
                        <Image source={{ uri: 'https://i.pravatar.cc/150?u=aris' }} style={styles.nestedAvatar} />
                        <View style={styles.commentBubble}>
                          <Text style={styles.commentAuthor}>{reply.author}</Text>
                          <Text style={styles.commentContent}>{reply.content}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <FlatList
        data={POSTS_DATA}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.feedContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* --- DYNAMIC INPUT AREA --- */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={styles.bottomInputContainer}>
          {replyingTo && (
            <View style={styles.replyingBadge}>
              <Text style={styles.replyingText}>Replying to <Text style={{fontWeight: 'bold'}}>{replyingTo.name}</Text></Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}><Ionicons name="close-circle" size={18} color="#94a3b8" /></TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachBtn}><Ionicons name="camera-outline" size={24} color="#64748b" /></TouchableOpacity>
            <View style={styles.inputWrapper}>
              <TextInput 
                ref={inputRef}
                style={styles.textInput}
                placeholder="Write a comment..." /* Đã sửa Placeholder */
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity><Ionicons name="happy-outline" size={22} color="#64748b" /></TouchableOpacity>
            </View>
            <TouchableOpacity disabled={!commentText} style={styles.sendBtn}>
              <Ionicons name="send" size={22} color={commentText ? "#4f46e5" : "#cbd5e1"} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* NÚT FAB ĐĂNG BÀI */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => setIsPosting(true)}
      >
        <MaterialCommunityIcons name="pencil" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  feedContainer: { padding: 15, paddingBottom: 100 }, 
  postCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 15, marginBottom: 15, elevation: 1 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  postHeaderText: { flex: 1 },
  postAuthor: { fontWeight: 'bold', fontSize: 15, color: '#1e293b' },
  postTime: { color: '#94a3b8', fontSize: 11 },
  postTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 5 },
  postContentText: { fontSize: 14, color: '#475569', lineHeight: 20 },
  
  attachmentBox: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', 
    padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 12 
  },
  fileName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  fileSize: { fontSize: 11, color: '#94a3b8' },

  postFooter: { 
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', 
    marginTop: 15, paddingTop: 12, gap: 20 
  },
  interactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  interactionText: { color: '#64748b', fontSize: 13, fontWeight: '600' },

  commentsContainer: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 15 },
  commentItem: { flexDirection: 'row' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  nestedAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 10 },
  commentBubble: { backgroundColor: '#f1f5f9', padding: 10, borderRadius: 15, flex: 1 },
  commentAuthor: { fontWeight: 'bold', fontSize: 13, marginBottom: 2 },
  commentContent: { fontSize: 13, color: '#475569' },
  commentActionRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 5, marginLeft: 10, marginBottom: 10 },
  commentTime: { fontSize: 11, color: '#94a3b8' },
  actionText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },

  bottomInputContainer: { backgroundColor: 'white', padding: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  replyingBadge: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, marginBottom: 8 
  },
  replyingText: { fontSize: 12, color: '#64748b' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  attachBtn: { padding: 5 },
  inputWrapper: { 
    flex: 1, flexDirection: 'row', backgroundColor: '#f1f5f9', 
    borderRadius: 20, paddingHorizontal: 12, alignItems: 'center' 
  },
  textInput: { flex: 1, paddingVertical: 8, fontSize: 14, maxHeight: 100, color: '#1e293b' },
  sendBtn: { padding: 5 },

  fab: {
    position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, 
    backgroundColor: '#4f46e5', borderRadius: 28, justifyContent: 'center', 
    alignItems: 'center', elevation: 5, shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5
  }
});