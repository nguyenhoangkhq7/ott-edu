import React, { useState } from 'react';
import EditTeamScreen from './EditTeamScreen';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  FlatList, StatusBar 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// IMPORT CÁC TAB
import PostsTab from './tabs/PostsTab';
import FilesTab from './tabs/FilesTab';
import MembersTab from './tabs/MembersTab';
import AssignmentsTab from './tabs/AssignmentsTab';

interface TeamDetailScreenProps {
  team: { id: number, name: string, description?: string, isActive?: boolean };
  onBack: () => void;
}

export default function TeamDetailScreen({ team, onBack }: TeamDetailScreenProps) {
  const [activeTab, setActiveTab] = useState('Posts');
  const [editVisible, setEditVisible] = useState(false);
  const [teamState, setTeamState] = useState({
    ...team,
    joinCode: (team as any).joinCode || '',
    departmentId: (team as any).departmentId || 1,
  });

  // Hàm render nội dung tùy theo Tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Posts': return <PostsTab teamTitle={teamState.name} />;
      case 'Files': return <FilesTab />;
      case 'Members': return <MembersTab teamId={teamState.id} />;
      case 'Assignments':
        return <AssignmentsTab teamId={teamState.id} teamTitle={teamState.name} />;
      case 'Grades': 
        return <View style={styles.center}><Text style={styles.emptyText}>Grades will appear here.</Text></View>;
      default: return <PostsTab teamTitle={teamState.name} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Modal sửa thông tin lớp học */}
      {editVisible && (
        <View style={{ position: 'absolute', zIndex: 10, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0008' }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '92%', backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
              <EditTeamScreen
                team={teamState}
                onBack={() => setEditVisible(false)}
                onSuccess={updated => {
                  setTeamState(updated);
                  setEditVisible(false);
                }}
              />
            </View>
          </View>
        </View>
      )}
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER CỐ ĐỊNH */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        
        <View style={styles.teamInfo}>
          <View style={styles.miniIcon}>
            <MaterialCommunityIcons name="account-group" size={16} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{teamState.name}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{teamState.description || 'Lớp học'}</Text>
          </View>
        </View>

        <View style={styles.headerRightIcons}>
          <TouchableOpacity style={{ marginRight: 15 }}>
            <Ionicons name="search-outline" size={22} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditVisible(true)}>
            <Ionicons name="create-outline" size={22} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* THANH TAB MENU */}
      <View style={styles.tabBarWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['Posts', 'Files', 'Members', 'Assignments', 'Grades']}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => setActiveTab(item)}
              style={[styles.tabItem, activeTab === item && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === item && styles.activeTabText]}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item}
        />
      </View>

      {/* NỘI DUNG CHÍNH CỦA TAB */}
      <View style={{ flex: 1 }}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, 
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  backBtn: { padding: 4 },
  teamInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  miniIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8, backgroundColor: '#4f46e5' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  headerRightIcons: { flexDirection: 'row', alignItems: 'center' },

  tabBarWrapper: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tabItem: { paddingVertical: 14, paddingHorizontal: 20 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#4f46e5' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  activeTabText: { color: '#4f46e5' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 }
});