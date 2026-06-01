import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  DeviceEventEmitter, 
} from 'react-native';
import {
  fetchFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest,
  searchUsers, // 🚀 IMPORT HÀM SEARCH CỦA CHAT SERVICE VÀO ĐÂY
  mapApiUserToUser, 
} from "../../friends/friends.api";
import { mapApiFriendRequest } from '@/modules/friends/friends.mapper';

interface FriendsScreenProps {
  identity: any;
  socket: any; // 🚀 Thêm socket vào đây
}

export default function FriendsScreen({ identity, socket }: FriendsScreenProps) {  const [requests, setRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  
  // 🚀 BƯỚC 1: COPY STATE TÌM KIẾM TỪ WEB SANG (Bỏ useUserSearch)
  const [keyword, setKeyword] = useState("");
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);



  

  // 🚀 BƯỚC 2: COPY LOGIC DEBOUNCE SEARCH TỪ SIDEBAR.TSX CỦA WEB SANG
  useEffect(() => {
    const normalized = keyword.trim();
    if (!normalized) {
      setGlobalUsers([]);
      return;
    }

    setIsSearchingGlobal(true);
    const timer = setTimeout(async () => {
      try {
        // Gọi thẳng API search của Chat Service (đảm bảo có _id)
        const results = await searchUsers(identity, normalized);
        setGlobalUsers(results || []);
      } catch (e) {
        console.error("Lỗi tìm kiếm global:", e);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword, identity]);

  // 🚀 BƯỚC 3: MAP DỮ LIỆU CHUẨN NHƯ WEB
  const mappedSearchResults = useMemo(() => {
    // Hàm mapApiUserToUser này sẽ biến apiUser._id thành user.id
    return globalUsers.map(mapApiUserToUser);
  }, [globalUsers]);

  // --- LOGIC FETCH LỜI MỜI KẾT BẠN GIỮ NGUYÊN ---
  const fetchRequests = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoadingRequests(true);
      const res = await fetchFriendRequests(identity);
      const mappedData = (res || []).map(mapApiFriendRequest);
      setRequests(mappedData); 
    } catch (error: any) {
      console.error("Lỗi lấy danh sách lời mời:", error.message);
    } finally {
      if (showLoading) setIsLoadingRequests(false);
    }
  }, [identity]);

  // 🚀 THÊM ĐOẠN NÀY VÀO FriendsScreen.tsx
useEffect(() => {
  if (!socket) {
    console.log("⚠️ [DEBUG_SOCKET] Socket chưa được truyền vào hoặc đang null!");
    return;
  }
  
  console.log("✅ [DEBUG_SOCKET] Đang lắng nghe trên socket ID:", socket.id);

  // 1. CÁCH LẮNG NGHE TỪNG EVENT (Đảm bảo tên trùng 100% với Backend)
  const handleRefresh = (data: any) => {
    console.log("🔥 [DEBUG_SOCKET] ĐÃ NHẬN ĐƯỢC EVENT:", data);
    fetchRequests(false);
  };

  socket.on("new_friend_request", handleRefresh);
  socket.on("friend_request_accepted", handleRefresh);
  socket.on("friend_request_rejected", handleRefresh);

  // 2. CÁCH LẮNG NGHE "CẢ THẾ GIỚI" (Dùng cái này để test xem server có gửi gì không)
  socket.onAny((event: string, ...args: any[]) => {
    console.log(`🚀 [DEBUG_SOCKET_CATCH_ALL] Nhận được event: "${event}"`, args);
  });

  return () => {
    socket.off("new_friend_request", handleRefresh);
    socket.off("friend_request_accepted", handleRefresh);
    socket.off("friend_request_rejected", handleRefresh);
    socket.offAny();
  };
}, [socket, fetchRequests]); // Chạy lại khi socket hoặc identity đổi

  useEffect(() => {
    if (identity) fetchRequests();
  }, [fetchRequests, identity]);

  // --- LOGIC NÚT BẤM KẾT BẠN ---
  const handleSendRequest = async (targetId: string) => {
    try {
      await sendFriendRequest(identity, targetId);
      Alert.alert("Thành công", "Đã gửi lời mời kết bạn!");
      setKeyword('');
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể gửi lời mời");
    }
  };

  const handleAction = async (requesterId: string, isAccept: boolean) => {
    try {
      setRequests((prev) => prev.filter((req) => {
        const id = req.sender?.id || req.sender?._id || req.id || req._id;
        return String(id) !== String(requesterId);
      }));

      if (isAccept) {
        await acceptFriendRequest(identity, requesterId);
      } else {
        await rejectFriendRequest(identity, requesterId);
      }
      fetchRequests(false);
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Thao tác thất bại");
      fetchRequests(false);
    }
  };

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SYNC_FRIENDS_DATA', () => {
      fetchRequests(false);
    });
    return () => { subscription.remove(); };
  }, [fetchRequests]);

  // --- LOGIC RENDER KẾT QUẢ TÌM KIẾM ---
 const renderSearchResult = ({ item }: { item: any }) => {
    // 🚀 Lấy y hệt web, có gì dùng nấy
    const uniqueId = item._id || item.id; 
    
    if (String(uniqueId) === String(identity?.id)) return null;

    return (
      <View style={styles.itemContainer}>
        <Image 
          source={{ uri: item.avatarUrl || `https://i.pravatar.cc/150?u=${item.email}` }} 
          style={styles.avatar} 
        />
        <View style={styles.infoCol}>
          <Text style={styles.name}>{item.fullName || item.name}</Text>
          <Text style={styles.codeTxt}>{item.email || item.code}</Text>
        </View>

        {/* 🚀 HIỆN NÚT KẾT BẠN CHO TẤT CẢ MỌI NGƯỜI */}
        <TouchableOpacity 
          style={styles.btnAdd} 
          onPress={() => handleSendRequest(uniqueId)} 
        >
          <Text style={styles.btnAddText}>Kết bạn</Text>
        </TouchableOpacity>
      </View>
    );
  };
 
  // ... (Giữ nguyên renderRequestItem và return UI như cũ)
  const renderRequestItem = ({ item }: { item: any }) => {
    const sender = item.sender || item;
    const senderId = sender.id || sender._id;

    return (
      <View style={styles.itemContainer}>
        <Image source={{ uri: sender.avatarUrl || "https://via.placeholder.com/50" }} style={styles.avatar} />
        <View style={styles.infoCol}>
          <Text style={styles.name}>{sender.name || sender.fullName}</Text>
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
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm tên hoặc email để kết bạn..."
          value={keyword}
          onChangeText={setKeyword}
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
        />
      </View>

      {keyword.length > 0 && (
        <View style={styles.searchResultArea}>
          <Text style={styles.sectionTitle}>Kết quả tìm kiếm</Text>
          {isSearchingGlobal ? (
            <ActivityIndicator color="#2196F3" />
          ) : (
            <FlatList
              data={mappedSearchResults} // 🚀 Dùng data đã map
              keyExtractor={(item) => `search-${item.id}`}
              renderItem={renderSearchResult}
              ListEmptyComponent={<Text style={styles.emptySmall}>Không tìm thấy người dùng này</Text>}
            />
          )}
          <View style={styles.divider} />
        </View>
      )}

      <Text style={styles.sectionTitle}>Lời mời đã nhận ({requests.length})</Text>
      {isLoadingRequests ? (
        <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => `req-${item.id}`}
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

// ... (Giữ nguyên StyleSheet của ông)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  header: { fontSize: 28, fontWeight: "800", color: "#1E293B", marginBottom: 20 },
  searchSection: { marginBottom: 20 },
  searchInput: { backgroundColor: "#fff", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", fontSize: 16, color: "#1E293B" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#64748B", marginBottom: 12, textTransform: 'uppercase' },
  searchResultArea: { maxHeight: 300, marginBottom: 20 },
  itemContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: "#F1F5F9" },
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