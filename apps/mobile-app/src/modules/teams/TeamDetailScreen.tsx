import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  FlatList, StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Import các tab
import PostsTab from './tabs/PostsTab';
import FilesTab from './tabs/FilesTab';
import MembersTab from './tabs/MembersTab';

// Import EditClassForm
import EditClassForm, { ClassData } from './EditClassForm';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Team {
  id: string;
  title: string;
  color: string;
  code?: string;
  description?: string;
  maxStudents?: number;
  currentStudents?: number;
  department?: string;
  school?: string;
  initials?: string;
  createdAt?: string;
  isActive?: boolean;
}

interface TeamDetailScreenProps {
  team: Team;
  onBack: () => void;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function TeamDetailScreen({ team, onBack }: TeamDetailScreenProps) {
  const [activeTab, setActiveTab] = useState('Posts');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const TABS = ['Posts', 'Files', 'Members', 'Assignments', 'Grades'];

  const classData: ClassData = {
    id: team.id,
    name: team.title,
    code: team.code ?? 'CS101-A',
    description: team.description ?? 'Introduction to core computer science concepts, algorithms, and data structures.',
    initials: team.initials ?? team.title.substring(0, 2).toUpperCase(),
    accentColor: team.color,
    maxStudents: team.maxStudents || 50,
    currentStudents: team.currentStudents || 32,
    isActive: team.isActive !== false,
    createdAt: team.createdAt || 'Sep 12, 2023',
    department: team.department || 'Computer Science',
    school: team.school || 'University of Excellence',
  };

  const handleEditClass = () => {
    setShowActionMenu(false);
    setShowEditForm(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Posts':       return <PostsTab teamTitle={team.title} />;
      case 'Files':       return <FilesTab />;
      case 'Members':     return <MembersTab />;
      case 'Assignments': return <View style={styles.center}><Text style={styles.emptyText}>No assignments yet.</Text></View>;
      case 'Grades':      return <View style={styles.center}><Text style={styles.emptyText}>Grades will appear here.</Text></View>;
      default:            return <PostsTab teamTitle={team.title} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── CANCELLED WARNING ── */}
      {team.isActive === false && (
        <View style={{ backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 16 }}>
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>
            THIS CLASS HAS BEEN CANCELLED AND IS INACTIVE
          </Text>
        </View>
      )}

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.teamInfo}>
          <View style={[styles.miniIcon, { backgroundColor: team.color }]}>
            <MaterialCommunityIcons name="account-group" size={16} color="white" />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>{team.title}</Text>
        </View>

        {/* Nút ellipsis menu - Edit/Delete class */}
        <View style={styles.actionMenuWrapper}>
          <TouchableOpacity
            onPress={() => setShowActionMenu(!showActionMenu)}
            activeOpacity={0.6}
            style={styles.menuButton}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#64748b" />
          </TouchableOpacity>

          {/* Dropdown menu */}
          {showActionMenu && (
            <View style={styles.actionMenu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleEditClass}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil" size={16} color="#4f46e5" />
                <Text style={styles.menuItemText}>Edit Class</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} disabled={team.isActive === false}>
                <Ionicons name="trash-outline" size={16} color={team.isActive === false ? "#cbd5e1" : "#ef4444"} />
                <Text style={[styles.menuItemText, { color: team.isActive === false ? "#cbd5e1" : "#ef4444" }]}>
                   {team.isActive === false ? 'Already Cancelled' : 'Cancel Class'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* ── TAB BAR ── */}
      <View style={styles.tabBarWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveTab(item)}
              style={[styles.tabItem, activeTab === item && styles.activeTab]}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === item && styles.activeTabText]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item}
        />
      </View>

      {/* ── TAB CONTENT ── */}
      <View style={{ flex: 1 }}>
        {renderTabContent()}
      </View>

      {/* ── EDIT CLASS FORM (modal slide-up) ── */}
      <EditClassForm
        visible={showEditForm}
        classData={classData}
        onClose={() => setShowEditForm(false)}
        onSaveSuccess={() => {
          console.log('Class updated (mock)');
        }}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    overflow: 'visible',
    zIndex: 100,
  },
  iconBtn: { padding: 6 },
  teamInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8, marginRight: 4 },
  miniIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b', flex: 1 },

  // Action Menu
  actionMenuWrapper: { position: 'relative', zIndex: 101 },
  menuButton: { padding: 10, justifyContent: 'center', alignItems: 'center' },
  actionMenu: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 102,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  menuDivider: { height: 1, backgroundColor: '#f1f5f9' },

  // Tab bar
  tabBarWrapper: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tabItem: { paddingVertical: 14, paddingHorizontal: 20 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#4f46e5' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  activeTabText: { color: '#4f46e5' },

  // Empty state
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});