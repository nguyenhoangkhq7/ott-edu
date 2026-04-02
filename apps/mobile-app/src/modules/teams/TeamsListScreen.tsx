import React, { useState } from 'react'; 
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  SafeAreaView, Platform, StatusBar, Image 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Import màn hình con
import CreateClassForm from './CreateClassForm';
import TeamDetailScreen from './TeamDetailScreen';

// Dữ liệu mẫu khớp với ảnh thiết kế
const TEAMS_DATA = [
  { id: '1', title: 'Computer Science 101', subtitle: '32 Students • Section A', iconName: 'code-tags', iconType: 'material', color: '#4f46e5' },
  { id: '2', title: 'Physics Lab - Section B', subtitle: '24 Students • Undergraduate', iconName: 'flask-outline', iconType: 'ionicon', color: '#10b981' },
  { id: '3', title: 'English Literature', subtitle: '28 Students • Grade 10', iconName: 'book-open-page-variant-outline', iconType: 'material', color: '#e11d48' },
  { id: '4', title: 'Grade 10 - Mathematics', subtitle: '30 Students • Advanced Track', iconName: 'sigma', iconType: 'text', color: '#f59e0b' },
  { id: '5', title: 'Intro to Psychology', subtitle: '45 Students • General Elective', iconName: 'head-lightbulb-outline', iconType: 'material', color: '#8b5cf6' },
  { id: '6', title: 'Faculty Lounge', subtitle: '18 Members • Staff Only', iconName: 'coffee-outline', iconType: 'material', color: '#475569' },
];

export default function TeamsListScreen() {
  const router = useRouter();
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Hiện màn hình chi tiết team
  if (selectedTeam) {
    return (
      <TeamDetailScreen
        team={selectedTeam}
        onBack={() => setSelectedTeam(null)}
      />
    );
  }

  // --- CÁC HÀM HỖ TRỢ RENDER ---
  const renderIcon = (item: typeof TEAMS_DATA[0]) => {
    if (item.iconType === 'text') {
      return <Text style={styles.iconText}>{item.iconName}</Text>;
    }
    if (item.iconType === 'material') {
      return <MaterialCommunityIcons name={item.iconName as any} size={28} color="#ffffff" />;
    }
    return <Ionicons name={item.iconName as any} size={26} color="#ffffff" />;
  };

  const renderTeamCard = ({ item }: { item: typeof TEAMS_DATA[0] }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => setSelectedTeam(item)} 
    >
      <View style={[styles.iconBox, { backgroundColor: item.color }]}>
        {renderIcon(item)}
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
      </View>

      <TouchableOpacity style={styles.moreBtn}>
        <Ionicons name="ellipsis-horizontal" size={20} color="#94a3b8" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // 3. Giao diện danh sách chính
  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
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

          <Text style={styles.sectionTitle}>YOUR TEAMS</Text>

          <FlatList
            data={TEAMS_DATA}
            keyExtractor={item => item.id}
            renderItem={renderTeamCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />

          {/* FAB */}
          <TouchableOpacity
            style={styles.fab}
            activeOpacity={0.8}
            onPress={() => setShowCreateForm(true)}
          >
            <Ionicons name="add" size={32} color="white" />
          </TouchableOpacity>

        </View>
      </SafeAreaView>

      {/* Create Class Form Modal */}
      <CreateClassForm
        visible={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onCreated={(name) => {
          console.log('Class created:', name);
        }}
      />
    </>
  );
}

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
    borderBottomColor: '#f1f5f9',
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
    fontSize: 24,
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
  },
  moreBtn: {
    padding: 8,
  },
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
    shadowColor: '#1868f0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  }
});