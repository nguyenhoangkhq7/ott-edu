import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Dữ liệu mẫu theo ảnh thiết kế
const OWNERS = [
  { id: 'o1', name: 'Dr. Aris Thorne', role: 'Instructor', status: 'online', avatar: 'https://i.pravatar.cc/150?u=aris' },
];

const MEMBERS = [
  { id: 'm1', name: 'Elena Rodriguez', role: 'Student • Mathematics Major', status: 'online', avatar: 'https://i.pravatar.cc/150?u=elena' },
  { id: 'm2', name: 'Marcus Chen', role: 'Student • Physics Major', status: 'offline', avatar: 'https://i.pravatar.cc/150?u=marcus' },
  { id: 'm3', name: 'Lucas Wright', role: 'Student • Data Science', status: 'away', avatar: null, initials: 'LW' },
];

export default function MembersTab() {
  const [search, setSearch] = useState('');
  const [showOwners, setShowOwners] = useState(true);
  const [showMembers, setShowMembers] = useState(true);

  const renderMember = (member: any) => (
    <View key={member.id} style={styles.memberCard}>
      <View style={styles.avatarContainer}>
        {member.avatar ? (
          <Image source={{ uri: member.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.initialsAvatar]}>
            <Text style={styles.initialsText}>{member.initials}</Text>
          </View>
        )}
        {/* Chấm trạng thái */}
        <View style={[
          styles.statusDot, 
          { backgroundColor: member.status === 'online' ? '#22c55e' : member.status === 'away' ? '#eab308' : '#94a3b8' }
        ]} />
      </View>

      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberRole}>{member.role}</Text>
      </View>

      <TouchableOpacity style={styles.moreBtn}>
        <Ionicons name="ellipsis-horizontal" size={20} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 1. THANH TÌM KIẾM */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search member"
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* 2. NHÓM QUẢN TRỊ (OWNERS) */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => setShowOwners(!showOwners)}
            activeOpacity={0.7}
          >
            <View style={styles.headerLeft}>
              <Ionicons name={showOwners ? "chevron-down" : "chevron-forward"} size={18} color="#64748b" />
              <Text style={styles.headerTitle}>Owners</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{OWNERS.length}</Text></View>
            </View>
          </TouchableOpacity>
          
          {showOwners && (
            <View style={styles.sectionContent}>
              {OWNERS.map(renderMember)}
            </View>
          )}
        </View>

        {/* 3. NHÓM THÀNH VIÊN (MEMBERS) */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => setShowMembers(!showMembers)}
            activeOpacity={0.7}
          >
            <View style={styles.headerLeft}>
              <Ionicons name={showMembers ? "chevron-down" : "chevron-forward"} size={18} color="#64748b" />
              <Text style={styles.headerTitle}>Members and guests</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>24</Text></View>
            </View>
          </TouchableOpacity>

          {showMembers && (
            <View style={styles.sectionContent}>
              {MEMBERS.map(renderMember)}
            </View>
          )}
        </View>

      </ScrollView>

      {/* 4. NÚT FAB THÊM THÀNH VIÊN */}
     <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        {/* Đã sửa thành Ionicons và person-add */}
        <Ionicons name="person-add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 45, fontSize: 15, color: '#1e293b' },

  // Section Styling
  section: { marginBottom: 15 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },

  // Member Card
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginTop: 5,
    overflow: 'hidden',
    // Shadow cho box trắng
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  avatarContainer: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  initialsAvatar: { backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center' },
  initialsText: { color: '#4338ca', fontWeight: 'bold', fontSize: 14 },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  memberRole: { fontSize: 12, color: '#64748b', marginTop: 2 },
  moreBtn: { padding: 5 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    backgroundColor: '#1868f0',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#1868f0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  }
});