import React, { useState, useEffect } from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { addGroupMembers } from '../group.api';
import { searchUsers } from '../../friends/friends.api'; // 🚀 Dùng searchUsers giống bản Web

// Thêm identity vào Props để xác thực
export default function AddMemberModal({ visible, onClose, conversationId, identity }: any) {
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
  if (visible && identity) {
    console.log("🔄 Modal đang load bạn bè cho identity:", identity.email);
    
    // Gọi searchUsers với keyword rỗng để lấy toàn bộ danh sách "bạn bè tiềm năng"
    searchUsers(identity, "")
      .then((res: any) => {
        console.log("✅ Đã load được danh sách:", res.length, "người");
        setFriends(res || []);
      })
      .catch(err => {
        console.error("❌ Lỗi load thành viên:", err.message);
      });
  }
}, [visible, identity]);
  // 🔍 Lấy danh sách gợi ý (search với từ khóa rỗng giống hệt Web)
  const loadSuggestedUsers = async () => {
    try {
      setIsLoading(true);
      const res = await searchUsers(identity, "");
      setFriends(res || []);
    } catch (error: any) {
      console.error("Lỗi lấy danh sách gợi ý:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedIds.length === 0) return;

    try {
      // 🛡️ CHỐT CHẶN 1: Chỉ lấy các ID đúng định dạng MongoDB (24 ký tự)
      const validParticipants = selectedIds.filter(id => id.length === 24);

      if (validParticipants.length === 0) {
        return Alert.alert('Lỗi', 'ID thành viên không hợp lệ');
      }

      console.log("🚀 Đang thêm thành viên:", {
        groupId: conversationId,
        participants: validParticipants 
      });

      // 🛡️ CHỐT CHẶN 2: Ép kiểu 'any' để đổi key thành 'participants' cho khớp Backend
      await addGroupMembers(identity, conversationId, {
        participants: validParticipants, // 👈 Đổi từ memberIds thành participants
      } as any);

      Alert.alert('Thành công', 'Đã thêm thành viên vào nhóm');
      onClose(); 
      
    } catch (error: any) {
      // 💡 In ra để xem Backend đang "chửi" cái gì
      if (error.response) {
        console.log("❌ Nội dung lỗi 400 từ Backend:", JSON.stringify(error.response.data, null, 2));
      }
      Alert.alert('Lỗi', error.response?.data?.message || 'Thêm thành viên thất bại');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Thêm thành viên</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeTxt}>Đóng</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <Text style={styles.loadingTxt}>Đang tải danh sách...</Text>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={item => item.id || item._id} // Hỗ trợ cả id và _id
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.item} 
                  onPress={() => {
                    const id = item.id || item._id;
                    setSelectedIds(prev => 
                      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                    );
                  }}
                >
                  <View>
                    <Text style={styles.nameTxt}>{item.fullName}</Text>
                    <Text style={styles.emailTxt}>{item.email}</Text>
                  </View>
                  <Text style={styles.checkIcon}>
                    {selectedIds.includes(item.id || item._id) ? '✅' : '⬜'}
                  </Text>
                </TouchableOpacity>
              )}
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '75%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  closeTxt: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  nameTxt: { fontSize: 16, fontWeight: '600', color: '#334155' },
  emailTxt: { fontSize: 13, color: '#64748B' },
  checkIcon: { fontSize: 20 },
  loadingTxt: { textAlign: 'center', marginTop: 20, color: '#64748B' },
  btn: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnDisabled: { backgroundColor: '#94A3B8' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});