import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router"; // 🚀 Dùng Expo Router
import { createGroupConversation } from "../group.api";
import { searchUsers } from "../../friends/friends.api"; // 🚀 Đổi sang searchUsers giống Web
import { useSocket } from "../../../shared/hooks/useSocket";

// 🚀 Nhận identity từ Props (Lấy từ AuthContext của ông ra nhé)
export default function CreateGroupScreen({ identity }: any) {
  if (!identity || !identity.email) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Đang tải thông tin xác thực...</Text>
      </View>
    );
  }
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🔌 Khởi tạo socket với identity thật
 const socket = useSocket(identity.id, identity.email);

  useEffect(() => {
    if (identity) {
      loadSuggestedUsers();
    }
  }, [identity]);

  // 🔍 Lấy danh sách gợi ý (search rỗng giống Web)
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedIds.length === 0) {
      return Alert.alert("Lỗi", "Vui lòng nhập tên nhóm và chọn thành viên");
    }

    try {
      // 🕵️‍♂️ Lọc lại ID: Chỉ lấy những ID có độ dài của MongoDB (24 ký tự)
      // Nếu ID nào ngắn quá thì mình biết đó là ID MySQL, không gửi lên.
      const validParticipants = selectedIds.filter(id => id.length === 24);
      
      if (validParticipants.length === 0) {
        return Alert.alert("Lỗi", "Danh sách thành viên không hợp lệ (ID sai định dạng)");
      }

      console.log("🚀 Đang gửi yêu cầu tạo nhóm với:", { name: groupName, participants: validParticipants });

      const res = await createGroupConversation(identity, {
        name: groupName,
        participants: validParticipants, // 👈 Dùng đúng tên participants
      } as any);

      Alert.alert("Thành công", "Đã tạo nhóm!");
      router.replace('/chat');
      
    } catch (error: any) {
      // 💡 Tip: Log chi tiết lỗi từ server trả về để biết nó chê chỗ nào
      console.error("❌ Chi tiết lỗi 400:", error.response?.data);
      Alert.alert("Lỗi", error.message || "Không thể tạo nhóm");
    }
  };
  return (
    <View style={styles.container}>
      {/* Input tên nhóm */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Tên nhóm mới</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Nhóm học Java, Đồ án CNM..."
          placeholderTextColor="#94A3B8"
          value={groupName}
          onChangeText={setGroupName}
        />
      </View>

      <Text style={styles.subtitle}>
        Chọn thành viên ({selectedIds.length})
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id || item._id}
          renderItem={({ item }) => {
            const id = item.id || item._id;
            const isSelected = selectedIds.includes(id);
            return (
              <TouchableOpacity
                style={[styles.friendItem, isSelected && styles.friendItemActive]}
                onPress={() => toggleSelect(id)}
              >
                <View>
                  <Text style={styles.friendName}>{item.fullName}</Text>
                  <Text style={styles.friendEmail}>{item.email}</Text>
                </View>
                <View
                  style={[styles.checkbox, isSelected && styles.checkboxActive]}
                />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyTxt}>Không tìm thấy bạn bè để thêm</Text>
          }
        />
      )}

      {/* Nút Tạo Nhóm cố định ở dưới */}
      <TouchableOpacity 
        style={[styles.createBtn, (selectedIds.length === 0 || !groupName.trim()) && styles.createBtnDisabled]} 
        onPress={handleCreateGroup}
        disabled={selectedIds.length === 0 || !groupName.trim()}
      >
        <Text style={styles.createBtnText}>Bắt đầu thảo luận nhóm</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F8FAFC" },
  inputSection: { marginBottom: 20 },
  label: { fontSize: 14, color: "#64748B", marginBottom: 8, fontWeight: "600" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1E293B",
  },
  subtitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12, color: "#1E293B" },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  friendItemActive: { borderColor: "#2196F3", backgroundColor: "#EFF6FF" },
  friendName: { fontSize: 16, fontWeight: "600", color: "#334155" },
  friendEmail: { fontSize: 13, color: "#64748B", marginTop: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
  },
  checkboxActive: { backgroundColor: "#2196F3", borderColor: "#2196F3" },
  createBtn: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  createBtnDisabled: { backgroundColor: "#CBD5E1", shadowOpacity: 0 },
  createBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  emptyTxt: { textAlign: "center", marginTop: 30, color: "#94A3B8" },
});