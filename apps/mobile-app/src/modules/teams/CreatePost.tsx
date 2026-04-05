import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  SafeAreaView, Image, KeyboardAvoidingView, Platform, 
  StatusBar, ScrollView 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface CreatePostProps {
  onBack: () => void;
  teamTitle: string;
}

export default function CreatePost({ onBack, teamTitle }: CreatePostProps) {
  const [content, setContent] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header điều hướng */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity 
          disabled={!content.trim()} 
          style={[styles.postBtn, !content.trim() && styles.disabledBtn]}
          onPress={() => {
            console.log("Đăng bài:", content);
            onBack();
          }}
        >
          <Text style={styles.postBtnText}>Post</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {/* Thông tin người đăng */}
          <View style={styles.userRow}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?u=me' }} 
              style={styles.avatar} 
            />
            <View>
              <Text style={styles.userName}>Tran Hau</Text>
              <View style={styles.targetTeam}>
                <Text style={styles.targetText}>Posting to </Text>
                <Text style={styles.teamName}>{teamTitle}</Text>
              </View>
            </View>
          </View>

          {/* Ô nhập nội dung bài viết */}
          <TextInput
            style={styles.input}
            placeholder="Share something with your class..."
            placeholderTextColor="#94a3b8"
            multiline
            autoFocus={true}
            value={content}
            onChangeText={setContent}
          />
        </ScrollView>

        {/* Thanh công cụ đính kèm (Toolbar) */}
        <View style={styles.toolbar}>
          <Text style={styles.toolbarHint}>Add to your post:</Text>
          <View style={styles.toolbarIcons}>
            <TouchableOpacity style={styles.toolBtn}>
              <Ionicons name="image-outline" size={26} color="#4f46e5" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn}>
              <Ionicons name="camera-outline" size={26} color="#10b981" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn}>
              <Ionicons name="attach-outline" size={26} color="#f59e0b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn}>
              <Ionicons name="location-outline" size={26} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn}>
              <Ionicons name="happy-outline" size={26} color="#8b5cf6" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  cancelText: { fontSize: 16, color: '#64748b', fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
  postBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  disabledBtn: { backgroundColor: '#cbd5e1' },
  postBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  
  contentContainer: { padding: 20 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, marginRight: 12 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  targetTeam: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  targetText: { fontSize: 12, color: '#94a3b8' },
  teamName: { fontSize: 12, color: '#4f46e5', fontWeight: '600' },
  
  input: {
    fontSize: 18, color: '#1e293b', lineHeight: 26, minHeight: 150,
    textAlignVertical: 'top'
  },
  
  toolbar: {
    borderTopWidth: 1, borderTopColor: '#f1f5f9', padding: 16,
    backgroundColor: '#ffffff'
  },
  toolbarHint: { fontSize: 13, color: '#64748b', marginBottom: 12, fontWeight: '500' },
  toolbarIcons: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  toolBtn: { padding: 8 }
});