import React from 'react';
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, 
  Platform, Dimensions 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  className: string;
  onGoToClass: () => void;
  onAddMembers: () => void;
}

export default function SuccessModal({ 
  visible, onClose, className, onGoToClass, onAddMembers 
}: SuccessModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Nút đóng góc trên bên phải */}
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>

          {/* Icon Thành công */}
          <View style={styles.iconContainer}>
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle}>
                <Ionicons name="checkmark" size={40} color="white" />
              </View>
            </View>
            {/* Các chấm trang trí nhỏ */}
            <View style={[styles.dot, { top: 10, right: -5, backgroundColor: '#e2e8f0' }]} />
            <View style={[styles.dot, { bottom: 20, left: -15, backgroundColor: '#bbf7d0' }]} />
          </View>

          {/* Nội dung thông báo */}
          <Text style={styles.title}>Your class is ready!</Text>
          <Text style={styles.description}>
            <Text style={styles.boldText}>{className}</Text> has been successfully created. You can now start managing your curriculum and inviting students.
          </Text>

          {/* Các nút bấm */}
          <TouchableOpacity style={styles.primaryBtn} onPress={onGoToClass}>
            <Text style={styles.primaryBtnText}>Go to Class</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onAddMembers}>
            <Ionicons name="person-add" size={20} color="#1e293b" />
            <Text style={styles.secondaryBtnText}>Add Members now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterBtn} onPress={onClose}>
            <Text style={styles.laterBtnText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  iconContainer: {
    width: 120,
    height: 120,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0fdf4', // Xanh lá cực nhạt
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22c55e', // Xanh lá đậm
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  boldText: {
    color: '#334155',
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#4f46e5', // Màu xanh tím y hệt ảnh
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  secondaryBtnText: {
    color: '#1e293b',
    fontWeight: 'bold',
    fontSize: 16,
  },
  laterBtn: {
    paddingVertical: 8,
  },
  laterBtnText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
});