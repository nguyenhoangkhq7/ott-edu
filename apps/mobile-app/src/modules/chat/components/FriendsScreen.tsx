import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
  DeviceEventEmitter, // 🚀 THÊM IMPORT NÀY VÀO ĐỂ NGHE LOA
} from 'react-native';
import {
  fetchFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  searchUsers,
  sendFriendRequest,
} from "../../friends/friends.api";

export default function FriendsScreen({ identity }: any) {
  const [requests, setRequests] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // 🚀 XÓA useSocket Ở ĐÂY RỒI NHA ĐẠI CA, APP GIỜ NHẸ TÊNH

  // Dùng useCallback để tránh render lại vô cớ
  const fetchRequests = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const res = await fetchFriendRequests(identity);
      setRequests(res || []);
    } catch (error: any) {
      console.error("Lỗi lấy danh sách lời mời:", error.message);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [identity]);

  useEffect(() => {
    if (identity) {
      fetchRequests();
    }
  }, [fetchRequests, identity]);

  // 🔍 Tìm kiếm người dùng mới để kết bạn
  const handleSearch = async (text: string) => {
    setSearchKeyword(text);
    if (text.trim().length > 1) {
      setIsSearching(true);
      try {
        const users = await searchUsers(identity, text);
        setSearchResults(users.filter((u: any) => (u.id || u._id) !== identity.id));
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  // 📤 Gửi lời mời kết bạn
  const handleSendRequest = async (targetId: string) => {
    try {
      await sendFriendRequest(identity, targetId);
      Alert.alert("Thành công", "Đã gửi lời mời kết bạn!");
      setSearchResults(prev => prev.filter(u => (u.id || u._id) !== targetId));
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể gửi lời mời");
    }
  };

  // ✅ Chấp nhận / ❌ Từ chối lời mời
  const handleAction = async (requesterId: string, isAccept: boolean) => {
    try {
      // 🚀 OPTIMISTIC UPDATE: Ẩn ngay khỏi màn hình trong 0.1s để tạo cảm giác siêu mượt
      setRequests((prev) => prev.filter((req) => {
        const id = req.sender?.id || req.sender?._id || req.id || req._id;
        return id !== requesterId;
      }));

      // Sau đó âm thầm gọi API
      if (isAccept) {
        await acceptFriendRequest(identity, requesterId);
      } else {
        await rejectFriendRequest(identity, requesterId);
      }

      // Xong xuôi thì fetch ngầm lại để đảm bảo data chuẩn 100%
      fetchRequests(false);

    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Thao tác thất bại");
      fetchRequests(false); // Lỗi thì lấy lại data cũ để phục hồi màn hình
    }
  };

  // ✨ REALTIME CAO CẤP: Nghe loa nội bộ từ ChatLayout phát ra
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SYNC_FRIENDS_DATA', () => {
      console.log("🟢 [Màn hình Bạn Bè] Nghe tiếng loa, đang cập nhật danh sách lời mời...");
      fetchRequests(false); // Load lại ngầm, không chớp giật UI
    });

    return () => { 
      subscription.remove(); // Tắt loa khi rời khỏi màn hình này
    };
  }, [fetchRequests]);

  // Render từng dòng kết quả tìm kiếm
  const renderSearchResult = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Image source={{ uri: item.avatarUrl || "https://via.placeholder.com/50" }} style={styles.avatar} />
      <View style={styles.infoCol}>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.codeTxt}>{item.email}</Text>
      </View>
      <TouchableOpacity style={styles.btnAdd} onPress={() => handleSendRequest(item.id || item._id)}>
        <Text style={styles.btnAddText}>Kết bạn</Text>
      </TouchableOpacity>
    </View>
  );

  // Render từng lời mời đang chờ
  const renderRequestItem = ({ item }: { item: any }) => {
    const sender = item.sender || item;
    const senderId = sender.id || sender._id;

    return (
      <View style={styles.itemContainer}>
        <Image source={{ uri: sender.avatarUrl || "https://via.placeholder.com/50" }} style={styles.avatar} />
        <View style={styles.infoCol}>
          <Text style={styles.name}>{sender.fullName}</Text>
          <Text style={styles.codeTxt}>Muốn kết bạn</Text>
        </View>
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={() => handleAction(senderId, true)}>
            <Text style={styles.btnText}>Đồng ý</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => handleAction(senderId, false)}>
            <Text style={styles.btnTextReject}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bạn bè</Text>

      {/* 🔍 Thanh tìm kiếm */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm tên hoặc email để kết bạn..."
          value={searchKeyword}
          onChangeText={handleSearch}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* 📱 Kết quả tìm kiếm */}
      {searchKeyword.length > 0 && (
        <View style={styles.searchResultArea}>
          <Text style={styles.sectionTitle}>Kết quả tìm kiếm</Text>
          {isSearching ? (
            <ActivityIndicator color="#2196F3" />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => `search-${item.id || item._id}`}
              renderItem={renderSearchResult}
              ListEmptyComponent={<Text style={styles.emptySmall}>Không tìm thấy người dùng này</Text>}
            />
          )}
          <View style={styles.divider} />
        </View>
      )}

      {/* 📋 Danh sách lời mời */}
      <Text style={styles.sectionTitle}>Lời mời đã nhận ({requests.length})</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => `req-${item.id || item._id}`}
          renderItem={renderRequestItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có lời mời kết bạn nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  header: { fontSize: 28, fontWeight: "800", color: "#1E293B", marginBottom: 20 },
  searchSection: { marginBottom: 20 },
  searchInput: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontSize: 16,
    color: "#1E293B",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#64748B", marginBottom: 12, textTransform: 'uppercase' },
  searchResultArea: { maxHeight: 300, marginBottom: 20 },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  infoCol: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: "#334155" },
  codeTxt: { fontSize: 12, color: "#94A3B8" },
  btnAdd: { backgroundColor: "#2196F3", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  btnAddText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  btnRow: { flexDirection: "row", gap: 6 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  btnAccept: { backgroundColor: "#10B981" },
  btnReject: { backgroundColor: "#F1F5F9" },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  btnTextReject: { color: "#64748B", fontWeight: "bold", fontSize: 12 },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: "#94A3B8", fontSize: 14 },
  emptySmall: { color: "#94A3B8", fontSize: 12, textAlign: 'center', padding: 10 },
});