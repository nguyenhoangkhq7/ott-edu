import React, { useState, useEffect } from 'react';
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

import { teamApi, TeamMember } from '../team.api';
import * as chatApi from '../../chat/chatApi';

interface MembersTabProps {
  teamId: number;
}

export default function MembersTab({ teamId }: MembersTabProps) {
  const [search, setSearch] = useState('');
  const [showOwners, setShowOwners] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [owners, setOwners] = useState<TeamMember[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string|null>(null);
  const [addSuccess, setAddSuccess] = useState<string|null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const data = await teamApi.getMembers(teamId);
        // Phân loại owner/leader và member
        setOwners(data.filter((m) => m.role === 'LEADER' || m.role === 'OWNER'));
        setMembers(data.filter((m) => m.role !== 'LEADER' && m.role !== 'OWNER'));
      } catch (e) {
        setOwners([]);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };
    if (teamId) fetchMembers();
  }, [teamId]);

  const renderMember = (member: TeamMember) => (
    <View key={member.id} style={styles.memberCard}>
      <View style={styles.avatarContainer}>
        {member.avatar ? (
          <Image source={{ uri: member.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.initialsAvatar]}>
            <Text style={styles.initialsText}>
              {member.firstName?.[0] || ''}{member.lastName?.[0] || ''}
            </Text>
          </View>
        )}
        <View style={[styles.statusDot, { backgroundColor: '#94a3b8' }]} />
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.firstName} {member.lastName}</Text>
        <Text style={styles.memberRole}>{member.email}</Text>
      </View>
      <TouchableOpacity style={styles.moreBtn}>
        <Ionicons name="ellipsis-horizontal" size={20} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );

  // Lấy conversationId từ teamId (giả định conversationId = teamId, nếu không đúng cần mapping từ backend)
  const conversationId = String(teamId);

  // Hàm thêm thành viên
  const handleAddMember = async () => {
    setAddLoading(true);
    setAddError(null);
    setAddSuccess(null);
    try {
      // 1. Thêm vào team
      await teamApi.addMember(teamId, { email: addEmail, role: 'MEMBER' });
      // 2. Thêm vào nhóm chat
      await chatApi.requestOrAddGroupMember(conversationId, { email: addEmail });
      setAddSuccess('Thêm thành viên thành công!');
      setAddEmail('');
      // Reload lại danh sách
      const data = await teamApi.getMembers(teamId);
      setOwners(data.filter((m) => m.role === 'LEADER' || m.role === 'OWNER'));
      setMembers(data.filter((m) => m.role !== 'LEADER' && m.role !== 'OWNER'));
    } catch (e: any) {
      setAddError(e?.message || 'Thêm thành viên thất bại');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => setShowOwners(!showOwners)}
            activeOpacity={0.7}
          >
            <View style={styles.headerLeft}>
              <Ionicons name={showOwners ? "chevron-down" : "chevron-forward"} size={18} color="#64748b" />
              <Text style={styles.headerTitle}>Owners</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{owners.length}</Text></View>
            </View>
          </TouchableOpacity>
          {showOwners && (
            <View style={styles.sectionContent}>
              {owners.map(renderMember)}
            </View>
          )}
        </View>
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => setShowMembers(!showMembers)}
            activeOpacity={0.7}
          >
            <View style={styles.headerLeft}>
              <Ionicons name={showMembers ? "chevron-down" : "chevron-forward"} size={18} color="#64748b" />
              <Text style={styles.headerTitle}>Members and guests</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{members.length}</Text></View>
            </View>
          </TouchableOpacity>
          {showMembers && (
            <View style={styles.sectionContent}>
              {members.map(renderMember)}
            </View>
          )}
        </View>
      </ScrollView>
      {/* Modal thêm thành viên */}
      {showAddModal && (
        <View style={{ position:'absolute', left:0, top:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.2)', justifyContent:'center', alignItems:'center', zIndex:10 }}>
          <View style={{ backgroundColor:'#fff', borderRadius:16, padding:24, minWidth:300 }}>
            <Text style={{ fontWeight:'bold', fontSize:16, marginBottom:12 }}>Thêm thành viên vào nhóm</Text>
            <TextInput
              style={{ borderWidth:1, borderColor:'#e5e7eb', borderRadius:8, padding:10, marginBottom:12, fontSize:15 }}
              placeholder="Nhập email thành viên"
              value={addEmail}
              onChangeText={setAddEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {addError && <Text style={{ color:'#e11d48', marginBottom:8 }}>{addError}</Text>}
            {addSuccess && <Text style={{ color:'#10b981', marginBottom:8 }}>{addSuccess}</Text>}
            <View style={{ flexDirection:'row', justifyContent:'flex-end', gap:8 }}>
              <TouchableOpacity
                style={{ paddingVertical:10, paddingHorizontal:18, borderRadius:8, backgroundColor:'#94a3b8', marginRight:8 }}
                onPress={() => { setShowAddModal(false); setAddError(null); setAddSuccess(null); setAddEmail(''); }}
                disabled={addLoading}
              >
                <Text style={{ color:'#fff', fontWeight:'bold' }}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingVertical:10, paddingHorizontal:18, borderRadius:8, backgroundColor:'#1868f0' }}
                onPress={handleAddMember}
                disabled={addLoading || !addEmail}
              >
                <Text style={{ color:'#fff', fontWeight:'bold' }}>Thêm</Text>
              </TouchableOpacity>
            </View>
            {addLoading && <View style={{ marginTop:12 }}><Text>Đang thêm...</Text></View>}
          </View>
        </View>
      )}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => setShowAddModal(true)}>
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