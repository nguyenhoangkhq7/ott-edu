import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  FlatList, StatusBar 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// IMPORT CÁC TAB
import PostsTab from './tabs/PostsTab';
import FilesTab from './tabs/FilesTab';
import MembersTab from './tabs/MembersTab';

interface TeamDetailScreenProps {
  team: { id: string, title: string, color: string };
  onBack: () => void;
}

export default function TeamDetailScreen({ team, onBack }: TeamDetailScreenProps) {
  const [activeTab, setActiveTab] = useState('Posts');

  // Hàm render nội dung tùy theo Tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Posts': return <PostsTab teamTitle={team.title} />; // Truyền tên lớp xuống
      case 'Files': return <FilesTab />;
      case 'Members': return <MembersTab />;
      case 'Assignments': 
        return <View style={styles.center}><Text style={styles.emptyText}>No assignments yet.</Text></View>;
      case 'Grades': 
        return <View style={styles.center}><Text style={styles.emptyText}>Grades will appear here.</Text></View>;
      default: return <PostsTab teamTitle={team.title} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER CỐ ĐỊNH */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        
        <View style={styles.teamInfo}>
          <View style={[styles.miniIcon, { backgroundColor: team.color }]}>
            <MaterialCommunityIcons name="account-group" size={16} color="white" />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>{team.title}</Text>
        </View>

        <View style={styles.headerRightIcons}>
          <TouchableOpacity style={{ marginRight: 15 }}>
            <Ionicons name="search-outline" size={22} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={22} color="#64748b" />
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
  miniIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
  headerRightIcons: { flexDirection: 'row', alignItems: 'center' },

  tabBarWrapper: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tabItem: { paddingVertical: 14, paddingHorizontal: 20 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#4f46e5' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  activeTabText: { color: '#4f46e5' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 }
});