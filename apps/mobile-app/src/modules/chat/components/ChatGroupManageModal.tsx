import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation, User } from '../types';

interface ChatGroupManageModalProps {
  visible: boolean;
  conversation: Conversation | null;
  currentUser: User | null;
  ownerUser?: User | null;
  onClose: () => void;
  onOpenProfile?: (user: User) => void;
  onRemoveMember?: (memberId: string) => void;
  onDissolveGroup?: () => void;
  onLeaveGroup?: (newOwnerId?: string) => void;
}

export function ChatGroupManageModal({
  visible,
  conversation,
  currentUser,
  ownerUser,
  onClose,
  onOpenProfile,
  onRemoveMember,
  onDissolveGroup,
  onLeaveGroup,
}: ChatGroupManageModalProps) {
  const [selectedNewOwnerId, setSelectedNewOwnerId] = React.useState<string>('');
  const [showLeaveConfirm, setShowLeaveConfirm] = React.useState(false);
  const [showDissolveConfirm, setShowDissolveConfirm] = React.useState(false);
  const [pendingRemoveMember, setPendingRemoveMember] = React.useState<User | null>(null);

  React.useEffect(() => {
    if (!visible) {
      setSelectedNewOwnerId('');
      setShowLeaveConfirm(false);
      setShowDissolveConfirm(false);
      setPendingRemoveMember(null);
    }
  }, [visible]);

  if (!visible || !conversation || !currentUser) return null;

  const canManage = conversation.canManageGroup || conversation.myRole === 'owner';
  const owner = ownerUser || conversation.participants.find((p) => p.id === conversation.ownerId) || null;
  const memberCandidates = conversation.participants.filter((p) => p.id !== currentUser.id);

  const doLeave = () => {
    if (conversation.myRole === 'owner') {
      if (!selectedNewOwnerId) return;
      onLeaveGroup?.(selectedNewOwnerId);
      return;
    }
    onLeaveGroup?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.title}>Quyền nhóm</Text>
              <Text style={styles.subtitle}>Owner / Member</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Ionicons name="close" size={20} color="#334155" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.roleCard}>
              <View style={styles.roleRow}>
                <Ionicons name="shield-outline" size={16} color="#0F172A" />
                <Text style={styles.roleText}>Vai trò của bạn:</Text>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{conversation.myRole === 'owner' ? 'Owner' : 'Member'}</Text>
                </View>
              </View>
              <Text style={styles.roleHint}>
                {conversation.myRole === 'owner'
                  ? 'Bạn có thể xóa thành viên, giải tán nhóm hoặc chuyển quyền rồi rời nhóm.'
                  : 'Bạn có thể xem thông tin thành viên và rời nhóm.'}
              </Text>
            </View>

            {owner && conversation.myRole !== 'owner' && (
              <TouchableOpacity
                style={styles.ownerCard}
                activeOpacity={0.8}
                onPress={() => onOpenProfile?.(owner)}
              >
                <View style={styles.ownerInfo}>
                  <Text style={styles.sectionLabel}>Trưởng nhóm</Text>
                  <Text style={styles.ownerName}>{owner.name}</Text>
                </View>
                <Image source={{ uri: owner.avatarUrl }} style={styles.ownerAvatar} />
              </TouchableOpacity>
            )}

            {showLeaveConfirm && (
              <View style={styles.warnCard}>
                <Text style={styles.warnTitle}>
                  {conversation.myRole === 'owner'
                    ? 'Chọn trưởng nhóm mới trước khi rời nhóm'
                    : 'Xác nhận rời nhóm?'}
                </Text>

                {conversation.myRole === 'owner' && (
                  <View style={{ marginTop: 10 }}>
                    {memberCandidates.length > 0 ? memberCandidates.map((member) => (
                      <TouchableOpacity
                        key={member.id}
                        style={[
                          styles.pickRow,
                          selectedNewOwnerId === member.id && styles.pickRowSelected,
                        ]}
                        onPress={() => setSelectedNewOwnerId(member.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.pickLeft}>
                          <Image source={{ uri: member.avatarUrl }} style={styles.pickAvatar} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.pickName}>{member.name}</Text>
                            <Text style={styles.pickSub}>{member.email || member.code || ''}</Text>
                          </View>
                        </View>
                        <Text style={styles.pickFlag}>{selectedNewOwnerId === member.id ? 'Đã chọn' : 'Chọn'}</Text>
                      </TouchableOpacity>
                    )) : (
                      <Text style={styles.warnText}>Không có thành viên nào khác để chuyển quyền.</Text>
                    )}
                  </View>
                )}

                <View style={styles.warnActions}>
                  <TouchableOpacity
                    style={[styles.warnBtn, styles.warnBtnPrimary]}
                    onPress={doLeave}
                    activeOpacity={0.85}
                    disabled={conversation.myRole === 'owner' && !selectedNewOwnerId}
                  >
                    <Text style={styles.warnBtnPrimaryText}>Xác nhận rời nhóm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.warnBtn}
                    onPress={() => {
                      setShowLeaveConfirm(false);
                      setSelectedNewOwnerId('');
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.warnBtnText}>Hủy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {showDissolveConfirm && (
              <View style={styles.dangerCard}>
                <Text style={styles.warnTitle}>Giải tán nhóm này? Hành động này không thể hoàn tác.</Text>
                <View style={styles.warnActions}>
                  <TouchableOpacity
                    style={[styles.warnBtn, styles.dangerPrimary]}
                    onPress={() => onDissolveGroup?.()}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.dangerPrimaryText}>Xác nhận giải tán</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.warnBtn} onPress={() => setShowDissolveConfirm(false)} activeOpacity={0.85}>
                    <Text style={styles.warnBtnText}>Hủy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.memberList}>
              {conversation.participants.map((participant) => {
                const isCurrentUser = participant.id === currentUser.id;
                const isOwner = conversation.ownerId === participant.id;
                return (
                  <View key={participant.id} style={styles.memberRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => onOpenProfile?.(participant)}
                      style={styles.memberMain}
                    >
                      <Image source={{ uri: participant.avatarUrl }} style={styles.memberAvatar} />
                      <View style={styles.memberInfo}>
                        <View style={styles.memberTitleRow}>
                          <Text style={styles.memberName}>{participant.name}</Text>
                          {isOwner && <View style={styles.ownerPill}><Text style={styles.ownerPillText}>Owner</Text></View>}
                          {isCurrentUser && <View style={styles.mePill}><Text style={styles.mePillText}>Bạn</Text></View>}
                        </View>
                        <Text style={styles.memberSub}>{participant.email || participant.code || ''}</Text>
                      </View>
                    </TouchableOpacity>

                    {canManage && !isCurrentUser && !isOwner && (
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => setPendingRemoveMember(participant)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="person-remove-outline" size={15} color="#EF4444" />
                        <Text style={styles.removeBtnText}>Xóa</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerBtnOutline} onPress={() => setShowLeaveConfirm(true)} activeOpacity={0.85}>
              <Text style={styles.footerBtnOutlineText}>Rời nhóm</Text>
            </TouchableOpacity>
            {canManage && (
              <TouchableOpacity style={styles.footerBtnDanger} onPress={() => setShowDissolveConfirm(true)} activeOpacity={0.85}>
                <Ionicons name="trash-outline" size={14} color="#fff" />
                <Text style={styles.footerBtnDangerText}>Giải tán nhóm</Text>
              </TouchableOpacity>
            )}
          </View>

          {pendingRemoveMember && (
            <View style={styles.bottomConfirmWrap}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setPendingRemoveMember(null)} />
              <View style={styles.bottomConfirmCard}>
                <Text style={styles.warnTitle}>Xóa {pendingRemoveMember.name} khỏi nhóm?</Text>
                <View style={styles.warnActions}>
                  <TouchableOpacity
                    style={[styles.warnBtn, styles.dangerPrimary]}
                    onPress={() => {
                      onRemoveMember?.(pendingRemoveMember.id);
                      setPendingRemoveMember(null);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.dangerPrimaryText}>Xác nhận xóa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.warnBtn} onPress={() => setPendingRemoveMember(null)} activeOpacity={0.85}>
                    <Text style={styles.warnBtnText}>Hủy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 28,
    overflow: 'hidden',
    maxHeight: '88%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  content: { padding: 16, paddingBottom: 24 },
  roleCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
  },
  rolePillText: { fontSize: 12, color: '#0284C7', fontWeight: '700' },
  roleHint: { marginTop: 8, fontSize: 12, color: '#64748B', lineHeight: 18 },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    marginBottom: 12,
  },
  ownerInfo: { flex: 1, marginRight: 12 },
  sectionLabel: { fontSize: 11, color: '#FB923C', fontWeight: '800', textTransform: 'uppercase' },
  ownerName: { marginTop: 4, fontSize: 16, fontWeight: '800', color: '#9A3412' },
  ownerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E2E8F0' },
  memberList: { marginTop: 4 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  memberMain: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0', marginRight: 12 },
  memberInfo: { flex: 1 },
  memberTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  memberName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  memberSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  ownerPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#FFEDD5' },
  ownerPillText: { fontSize: 11, color: '#C2410C', fontWeight: '700' },
  mePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#DBEAFE' },
  mePillText: { fontSize: 11, color: '#2563EB', fontWeight: '700' },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#FEF2F2' },
  removeBtnText: { fontSize: 12, color: '#EF4444', fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  footerBtnOutline: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FDBA74',
    alignItems: 'center',
  },
  footerBtnOutlineText: { color: '#F97316', fontWeight: '800', fontSize: 14 },
  footerBtnDanger: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  footerBtnDangerText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  warnCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  dangerCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warnTitle: { fontSize: 14, fontWeight: '800', color: '#92400E', lineHeight: 20 },
  warnText: { fontSize: 12, color: '#92400E', marginTop: 8 },
  pickRow: {
    borderWidth: 1,
    borderColor: '#FCD34D',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickRowSelected: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  pickLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  pickAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E2E8F0', marginRight: 10 },
  pickName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  pickSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  pickFlag: { fontSize: 12, color: '#B45309', fontWeight: '800' },
  warnActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  warnBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FCD34D',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  warnBtnText: { color: '#92400E', fontWeight: '800', fontSize: 13 },
  warnBtnPrimary: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  warnBtnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  dangerPrimary: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  dangerPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  bottomConfirmWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  bottomConfirmCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
});