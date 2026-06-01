import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';

interface ChatUserProfileModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
}

export function ChatUserProfileModal({ visible, user, onClose }: ChatUserProfileModalProps) {
  if (!user) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.hero} />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Ionicons name="close" size={20} color="#334155" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            </View>

            <Text style={styles.name}>{user.name}</Text>

            <View style={styles.badgeRow}>
              {!!user.role && (
                <View style={styles.badge}>
                  <Ionicons name="shield-outline" size={12} color="#475569" />
                  <Text style={styles.badgeText}>{user.role}</Text>
                </View>
              )}
              <View style={[styles.badge, styles.badgeOnline]}>
                <Ionicons name="radio-button-on-outline" size={12} color="#0284c7" />
                <Text style={[styles.badgeText, styles.badgeTextOnline]}>
                  {user.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                </Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="mail-outline" size={18} color="#64748B" />
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email || 'Chưa có email'}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="at-outline" size={18} color="#64748B" />
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Mã số / Code</Text>
                <Text style={styles.infoValue}>{user.code || 'Chưa có mã số'}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={onClose} style={styles.primaryBtn} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingHorizontal: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
  },
  header: {
    height: 108,
    backgroundColor: '#0EA5E9',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  hero: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0EA5E9',
  },
  closeBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    paddingTop: 52,
  },
  avatarWrap: {
    position: 'absolute',
    top: -42,
    alignSelf: 'center',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#FFF',
    padding: 4,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
    backgroundColor: '#E2E8F0',
  },
  name: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  badgeOnline: {
    backgroundColor: '#EFF6FF',
  },
  badgeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  badgeTextOnline: {
    color: '#0284c7',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 10,
  },
  infoTextWrap: { flex: 1 },
  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  actionsRow: {
    marginTop: 18,
    alignItems: 'flex-end',
  },
  primaryBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});