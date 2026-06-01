import React, { useState } from 'react';
import { 
  Modal, View, Text, FlatList, TouchableOpacity, 
  StyleSheet, Alert, TextInput, KeyboardAvoidingView, Platform 
} from 'react-native';
import { addGroupMembers } from '../group.api';
import { useUserSearch } from '../../../shared/hooks/useUserSearch'; 

export default function AddMemberModal({ visible, onClose, conversationId, identity, existingMemberIds = [] }: any) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const { keyword, setKeyword, users: friends, isLoading } = useUserSearch(identity, visible);

  const handleAddMembers = async () => {
    if (selectedIds.length === 0) return;

    try {
      const validParticipants = selectedIds.filter(id => id.length === 24);
      if (validParticipants.length === 0) {
        return Alert.alert('Lỗi', 'ID thành viên không hợp lệ');
      }

      await addGroupMembers(identity, conversationId, {
        participants: validParticipants,
      } as any);

      Alert.alert('Thành công', 'Đã thêm thành viên vào nhóm');
      onClose(); 
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Thêm thành viên thất bại');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Thêm thành viên</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeTxt}>Đóng</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm bạn bè, email hoặc MSSV..."
              placeholderTextColor="#94A3B8"
              value={keyword}
              onChangeText={setKeyword}
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.sectionTitle}>
            {keyword.length > 0 ? "KẾT QUẢ TÌM KIẾM" : "GỢI Ý THÊM VÀO NHÓM"}
          </Text>

          {isLoading ? (
            <Text style={styles.loadingTxt}>Đang tải danh sách...</Text>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={item => item.id || item._id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const id = item.id || item._id;
                // 🚀 Kiểm tra xem ID này đã có trong nhóm chưa
                const isAlreadyInGroup = existingMemberIds.includes(id);
                const isSelected = selectedIds.includes(id);

                return (
                  <TouchableOpacity 
                    style={[styles.item, isAlreadyInGroup && styles.itemDisabled]} 
                    disabled={isAlreadyInGroup} // 🛡️ Chặn không cho bấm
                    onPress={() => {
                      setSelectedIds(prev => 
                        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                      );
                    }}
                  >
                    <View>
                      <Text style={[styles.nameTxt, isAlreadyInGroup && styles.disabledTxt]}>{item.fullName}</Text>
                      <Text style={[styles.emailTxt, isAlreadyInGroup && styles.disabledTxt]}>{item.email}</Text>
                    </View>
                    
                    {/* 🚀 Thay đổi hiển thị nếu đã trong nhóm */}
                    {isAlreadyInGroup ? (
                      <Text style={styles.alreadyInGroupTxt}>Đã trong nhóm</Text>
                    ) : (
                      <Text style={styles.checkIcon}>{isSelected ? '✅' : '⬜'}</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          <TouchableOpacity 
            style={[styles.btn, selectedIds.length === 0 && styles.btnDisabled]} 
            onPress={handleAddMembers}
            disabled={selectedIds.length === 0}
          >
            <Text style={styles.btnText}>Xác nhận thêm ({selectedIds.length})</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '80%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  closeTxt: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
  searchBox: { marginBottom: 15 },
  searchInput: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, padding: 12, fontSize: 15, color: '#1E293B'
  },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94A3B8', marginBottom: 10 },
  
  // Styles cho trạng thái đã trong nhóm
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemDisabled: { opacity: 0.5 },
  nameTxt: { fontSize: 16, fontWeight: '600', color: '#334155' },
  emailTxt: { fontSize: 13, color: '#64748B' },
  disabledTxt: { color: '#94A3B8' },
  alreadyInGroupTxt: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold', fontStyle: 'italic' },
  
  checkIcon: { fontSize: 20 },
  loadingTxt: { textAlign: 'center', marginTop: 20, color: '#64748B' },
  btn: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnDisabled: { backgroundColor: '#94A3B8' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});