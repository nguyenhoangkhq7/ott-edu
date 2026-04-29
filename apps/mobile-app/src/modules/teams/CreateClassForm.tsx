import React, { useState } from 'react';
import { teamApi } from './team.api';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar,
  SafeAreaView 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SuccessModal from '../../shared/components/SuccessModal'; // Đảm bảo đường dẫn này đúng

interface CreateClassFormProps {
  onBack: () => void;
  onClose: () => void;
}


export default function CreateClassForm({ onBack, onClose }: CreateClassFormProps) {
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateClass = async () => {
    setLoading(true);
    setError(null);
    try {
      // Tạo joinCode và departmentId tạm thời (cần sửa nếu có UI chọn khoa)
      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const departmentId = 1;
      await teamApi.create({
        name: className,
        description,
        joinCode,
        departmentId,
      });
      setShowSuccess(true);
      setClassName('');
      setDescription('');
    } catch (err: any) {
      setError(err?.message || 'Tạo lớp thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn} activeOpacity={0.6}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create a class</Text>
        <TouchableOpacity onPress={onClose} style={styles.iconBtn} activeOpacity={0.6}>
          <Ionicons name="close" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.container} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Avatar Section: Vòng tròn nét đứt */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="camera-plus-outline" size={40} color="#cbd5e1" />
              <TouchableOpacity style={styles.editBadge} activeOpacity={0.8}>
                <MaterialCommunityIcons name="pencil" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarLabel}>Class Avatar</Text>
            <Text style={styles.avatarSubLabel}>
              This image helps students identify your class in their dashboard.
            </Text>
          </View>

          {/* Form Inputs */}
          <View style={styles.form}>
            <Text style={styles.inputLabel}>
              Name <Text style={{color: '#ef4444'}}>*</Text>
            </Text>
            <TextInput 
              style={styles.input}
              placeholder="e.g., Biology 101"
              placeholderTextColor="#cbd5e1"
              value={className}
              onChangeText={setClassName}
              maxLength={50}
            />

            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Description</Text>
              <Text style={styles.optionalLabel}>Optional</Text>
            </View>
            <TextInput 
              style={[styles.input, styles.textArea]}
              placeholder="What will students learn in this class?"
              placeholderTextColor="#cbd5e1"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
              maxLength={200}
            />
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#4f46e5" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              You'll be able to invite students and add co-teachers as soon as the class is created.
            </Text>
          </View>
        </ScrollView>

        {/* Footer Buttons cố định ở dưới */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.createBtn, (!className || loading) && styles.disabledBtn]}
            disabled={!className || loading}
            onPress={handleCreateClass}
            activeOpacity={0.8}
          >
            <Text style={styles.createBtnText}>{loading ? 'Creating...' : 'Create Class'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <View style={{ padding: 12, backgroundColor: '#fee2e2', borderRadius: 8, margin: 16 }}>
          <Text style={{ color: '#b91c1c', textAlign: 'center' }}>{error}</Text>
        </View>
      )}

      {/* Modal thông báo thành công */}
      <SuccessModal 
        visible={showSuccess}
        className={className}
        onClose={() => {
          setShowSuccess(false);
          onClose(); // Trở về màn hình danh sách Teams
        }}
        onGoToClass={() => {
          setShowSuccess(false);
          // Chuyển hướng vào chi tiết lớp học mới tạo
          onClose();
        }}
        onAddMembers={() => {
          setShowSuccess(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  header: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  iconBtn: { padding: 4 },
  container: { padding: 24, alignItems: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarCircle: {
    width: 130, height: 130, borderRadius: 65, borderStyle: 'dashed',
    borderWidth: 1.5, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, position: 'relative', backgroundColor: '#fcfdfe'
  },
  editBadge: {
    position: 'absolute', bottom: 8, right: 8, backgroundColor: '#4f46e5',
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'white'
  },
  avatarLabel: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginBottom: 4 },
  avatarSubLabel: { fontSize: 13, color: '#64748b', textAlign: 'center', paddingHorizontal: 20 },
  form: { width: '100%', marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionalLabel: { fontSize: 12, color: '#94a3b8' },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, padding: 14, fontSize: 15, color: '#1e293b', marginBottom: 20
  },
  textArea: { height: 100, paddingTop: 14 },
  infoBox: {
    flexDirection: 'row', backgroundColor: '#f5f7ff', padding: 16, borderRadius: 12, width: '100%'
  },
  infoIcon: { marginRight: 12, marginTop: 2 },
  infoText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 18 },
  footer: {
    flexDirection: 'row', 
    padding: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9', 
    gap: 12, 
    backgroundColor: 'white',
    paddingBottom: Platform.OS === 'ios' ? 20 : 16
  },
  cancelBtn: { 
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 10, 
    backgroundColor: '#f1f5f9', 
    alignItems: 'center' 
  },
  cancelBtnText: { fontWeight: '600', color: '#475569' },
  createBtn: { 
    flex: 2, 
    paddingVertical: 14, 
    borderRadius: 10, 
    backgroundColor: '#4f46e5', 
    alignItems: 'center' 
  },
  disabledBtn: { backgroundColor: '#94a3b8' },
  createBtnText: { fontWeight: 'bold', color: 'white' }
});