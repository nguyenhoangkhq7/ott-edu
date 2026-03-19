import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const FILES_DATA = [
  { id: 'f1', name: 'Lecture Slides', info: 'Modified 2 hours ago', type: 'folder', bgColor: '#fff7ed', iconColor: '#f59e0b' },
  { id: 'f2', name: 'Assignment Briefs', info: 'Yesterday at 3:15 PM', type: 'folder', bgColor: '#fff7ed', iconColor: '#f59e0b' },
  { id: 'f3', name: 'Course_Syllabus_Fall2024.pdf', info: 'Aug 24, 2024', type: 'pdf', bgColor: '#fef2f2', iconColor: '#ef4444' },
  { id: 'f4', name: 'Practice_Problems_Set1.docx', info: 'Aug 26, 2024', type: 'word', bgColor: '#eff6ff', iconColor: '#3b82f6' },
  { id: 'f5', name: 'Student_Grades_Draft.xlsx', info: 'Just now', type: 'excel', bgColor: '#f0fdf4', iconColor: '#22c55e' },
];

export default function FilesTab() {
  const renderFileItem = ({ item }: { item: typeof FILES_DATA[0] }) => (
    <TouchableOpacity style={styles.fileItem} activeOpacity={0.6}>
      <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
        {item.type === 'folder' && <Ionicons name="folder" size={24} color={item.iconColor} />}
        {item.type === 'pdf' && <MaterialCommunityIcons name="file-pdf-box" size={28} color={item.iconColor} />}
        {item.type === 'word' && <MaterialCommunityIcons name="file-word-box" size={28} color={item.iconColor} />}
        {item.type === 'excel' && <MaterialCommunityIcons name="file-excel-box" size={28} color={item.iconColor} />}
      </View>

      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.fileSubText}>{item.info}</Text>
      </View>

      <TouchableOpacity style={styles.moreBtn}>
        <Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 1. THANH ACTION BUTTONS */}
      <View style={styles.actionRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.newBtn}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.newBtnText}>New</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBtn}>
            <Ionicons name="cloud-upload-outline" size={18} color="#1e293b" />
            <Text style={styles.uploadBtnText}>Upload</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.toolIcon}><Ionicons name="filter-outline" size={20} color="#64748b" /></TouchableOpacity>
          <TouchableOpacity style={styles.toolIcon}><Ionicons name="list-outline" size={22} color="#64748b" /></TouchableOpacity>
        </View>
      </View>

      {/* 2. DANH SÁCH FILE */}
      <FlatList
        data={FILES_DATA}
        renderItem={renderFileItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* --- 3. NÚT DẤU CỘNG (FAB) --- */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => console.log("Mở menu thêm file/thư mục")}
      >
        <Ionicons name="add" size={35} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  actionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  leftActions: { flexDirection: 'row', gap: 8 },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  newBtn: {
    backgroundColor: '#1868f0', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, gap: 4,
  },
  newBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', gap: 6,
  },
  uploadBtnText: { color: '#1e293b', fontWeight: '600', fontSize: 14 },
  toolIcon: { padding: 2 },
  listContainer: {
    paddingBottom: 100,
  },
  fileItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 12, justifyContent: 'center',
    alignItems: 'center', marginRight: 16,
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  fileSubText: { fontSize: 12, color: '#94a3b8' },
  moreBtn: { padding: 5 },

  // --- STYLE CHO NÚT DẤU CỘNG ---
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    backgroundColor: '#1868f0',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    // Đổ bóng cho iOS & Android
    elevation: 8,
    shadowColor: '#1868f0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});