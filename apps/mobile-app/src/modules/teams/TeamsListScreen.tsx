import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Image,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Import các màn hình con cùng thư mục
import CreateTeam from './CreateTeam'; 
import TeamDetailScreen from './TeamDetailScreen';
import { teamApi, type Team } from './team.api';

export default function TeamsListScreen() {
  const router = useRouter();
  
  // --- QUẢN LÝ TRẠNG THÁI GIAO DIỆN ---
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  
  // State cho Modal khoá/mở khoá lớp học
  const [actionTeam, setActionTeam] = useState<Team | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await teamApi.getAll();
        if (mounted) {
          setTeams(Array.isArray(response) ? response : []);
        }
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : 'Không thể tải danh sách lớp học.');
          setTeams([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTeams();

    return () => {
      mounted = false;
    };
  }, [reloadTick]);

  const displayedTeams = useMemo(() => teams, [teams]);

  // Hàm xử lý khoá/mở khoá (Đã bổ sung vì file cũ của bạn gọi nhưng chưa định nghĩa)
  const handleToggleLock = async () => {
    if (!actionTeam) return;
    try {
      setActionLoading(true);
      setActionError(null);
      // Gọi API thực tế tại đây. Ví dụ: await teamApi.toggleStatus(actionTeam.id);
      
     await new Promise(res => setTimeout(() => res(true), 1000));
      
      setReloadTick(prev => prev + 1); // Load lại list
      setActionTeam(null); // Đóng modal
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
    } finally {
      setActionLoading(false);
    }
  };

  // 1. Nếu đang chọn xem chi tiết một Team
  if (selectedTeam) {
    return (
      <TeamDetailScreen 
        team={selectedTeam} 
        onBack={() => setSelectedTeam(null)} 
      />
    );
  }

  // 2. Nếu đang ở trạng thái "Tạo nhóm/Tham gia nhóm"
  if (isCreating) {
    return <CreateTeam onBack={() => setIsCreating(false)} />;
  }

  // --- CÁC HÀM HỖ TRỢ RENDER ---
  const renderIcon = (item: Team, index: number) => {
    const initials = item.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();

    const colors = ['#4f46e5', '#10b981', '#e11d48', '#f59e0b', '#8b5cf6', '#475569'];

    return (
      <View style={[styles.iconBox, { backgroundColor: colors[index % colors.length] }]}>
        <Text style={styles.iconText}>{initials}</Text>
      </View>
    );
  };

  // 3. Render từng phần tử trong danh sách
  const renderTeamCard = ({ item, index }: { item: Team; index: number }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => setSelectedTeam(item)} 
    >
      {/* Icon đại diện */}
      {renderIcon(item, index)}
      
      {/* Thông tin lớp học */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {item.description || 'Chưa có mô tả'}
        </Text>
      </View>

      {/* Nút hành động (Tuỳ chọn mở modal khoá lớp) */}
      <TouchableOpacity 
        style={styles.moreBtn}
        onPress={() => setActionTeam(item)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Modal thao tác khoá/mở lớp học - Được đưa ra ngoài cùng */}
      <Modal
        visible={!!actionTeam}
        transparent
        animationType="fade"
        onRequestClose={() => setActionTeam(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 320, alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, color: '#1e293b' }}>
              {actionTeam?.isActive === false ? 'Mở khoá lớp học?' : 'Khoá lớp học?'}
            </Text>
            <Text style={{ color: '#64748b', marginBottom: 20, textAlign: 'center', lineHeight: 22 }}>
              {actionTeam?.isActive === false
                ? 'Lớp học sẽ được mở lại cho thành viên tiếp tục hoạt động.'
                : 'Lớp học sẽ bị khoá, thành viên không thể truy cập tài liệu và bài tập.'}
            </Text>
            
            {actionError ? <Text style={{ color: '#e11d48', marginBottom: 12, fontSize: 13 }}>{actionError}</Text> : null}
            
            <View style={{ flexDirection: 'row', width: '100%', gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center' }}
                onPress={() => setActionTeam(null)}
                disabled={actionLoading}
              >
                <Text style={{ color: '#475569', fontWeight: 'bold' }}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: actionTeam?.isActive === false ? '#10b981' : '#e11d48', alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                onPress={handleToggleLock}
                disabled={actionLoading}
              >
                {actionLoading && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  {actionTeam?.isActive === false ? 'Mở khoá' : 'Khoá lớp'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?img=68' }} 
              style={styles.avatar}
            />
            <Text style={styles.headerTitle}>Teams</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search-outline" size={24} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="ellipsis-vertical" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>YOUR CLASSES</Text>
        
        {/* Nội dung danh sách */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1868f0" />
            <Text style={styles.loadingText}>Đang tải lớp học...</Text>
          </View>
        ) : error ? (
          <View style={styles.loadingBox}>
            <Ionicons name="cloud-offline-outline" size={40} color="#ef4444" />
            <Text style={[styles.loadingText, { color: '#ef4444', fontWeight: '500', marginTop: 8 }]}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => setReloadTick((value) => value + 1)}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={displayedTeams}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTeamCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Nút FAB dấu + */}
        <TouchableOpacity 
          style={styles.fab} 
          activeOpacity={0.8}
          onPress={() => setIsCreating(true)}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Giữ nguyên toàn bộ styles của bạn
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    marginLeft: 8,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, 
  },
  card: {
    backgroundColor: '#ffffff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconText: {
    color: '#ffffff',
    fontSize: 20, // Chỉnh nhỏ lại một chút để không bị tràn
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#1e293b',
    fontSize: 16,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 11,
    color: '#94a3b8',
  },
  moreBtn: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60, // Kích thước nút chuẩn
    height: 60,
    backgroundColor: '#1868f0',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1868f0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1868f0',
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});