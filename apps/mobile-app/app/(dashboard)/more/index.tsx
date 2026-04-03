import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Image, 
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// IMPORT Hook useAuth từ AuthProvider (Chú ý đường dẫn tương đối)
// Dựa vào cấu trúc thư mục của bạn, đường dẫn có thể là:
import { useAuth } from '../../../src/modules/auth/AuthProvider'; 

export default function MoreTab() {
  // Lấy thông tin user và hàm logout từ Context
  const { user, logout } = useAuth();
  const router = useRouter();

  // Tính toán tên hiển thị
  const displayName = useMemo(() => {
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return fullName || user?.email || "Người dùng";
  }, [user]);

  // --- LOGIC ĐĂNG XUẤT ---
  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Đăng xuất", 
          style: "destructive",
          onPress: () => {
            // CHỈ GỌI logout() LÀ ĐỦ
            // Không gọi router.replace() ở đây nữa, vì nó có thể xung đột với _layout.tsx
            void logout(); 
          }
        }
      ]
    );
  };

  // --- COMPONENT MENU ITEM (Dùng chung cho gọn code) ---
  const MenuItem = ({ icon, title, subtitle, isDestructive = false, onPress }: any) => (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.menuIconBox, isDestructive && { backgroundColor: '#fef2f2' }]}>
        <Ionicons 
          name={icon} 
          size={22} 
          color={isDestructive ? '#ef4444' : '#64748b'} 
        />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, isDestructive && { color: '#ef4444' }]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* 1. HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 2. THÔNG TIN NGƯỜI DÙNG (Lấy từ useAuth) */}
        <View style={styles.profileCard}>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/150?u=me' }} // Có thể đổi thành user?.avatar nếu API của bạn có trả về ảnh
            style={styles.avatar} 
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? "Không có email"}</Text>
            
            {/* Hiển thị vai trò (Roles) */}
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user?.roles?.join(", ") || "Thành viên"}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. NHÓM TÍNH NĂNG HỌC TẬP */}
        <Text style={styles.sectionTitle}>HỌC TẬP</Text>
        <View style={styles.menuGroup}>
          <MenuItem 
            icon="document-text-outline" 
            title="Bài tập (Assignments)" 
            subtitle="2 bài sắp đến hạn"
            onPress={() => console.log('Go to Assignments')} 
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="school-outline" 
            title="Bảng điểm (Grades)" 
            onPress={() => console.log('Go to Grades')} 
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="calendar-outline" 
            title="Lịch học (Calendar)" 
            onPress={() => console.log('Go to Calendar')} 
          />
        </View>

        {/* 4. NHÓM CÀI ĐẶT & HỖ TRỢ */}
        <Text style={styles.sectionTitle}>CÀI ĐẶT CHUNG</Text>
        <View style={styles.menuGroup}>
          <MenuItem 
            icon="settings-outline" 
            title="Cài đặt tài khoản" 
            onPress={() => console.log('Go to Settings')} 
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="help-circle-outline" 
            title="Trợ giúp & Hỗ trợ" 
            onPress={() => console.log('Go to Help')} 
          />
        </View>

        {/* 5. NÚT ĐĂNG XUẤT */}
        <View style={[styles.menuGroup, { marginTop: 20, marginBottom: 40 }]}>
          <MenuItem 
            icon="log-out-outline" 
            title="Đăng xuất" 
            isDestructive={true} 
            onPress={handleLogout} 
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  
  scrollContent: { padding: 16 },

  // --- Profile Card ---
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    alignItems: 'center'
  },
  avatar: { width: 64, height: 64, borderRadius: 32, marginRight: 16 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  profileEmail: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  roleBadge: {
    backgroundColor: '#e0e7ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: { color: '#4338ca', fontSize: 12, fontWeight: 'bold' },

  // --- Menu Groups ---
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 8
  },
  menuGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '500', color: '#1e293b' },
  menuSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 60 },
});