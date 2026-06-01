import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Switch } from 'react-native';
import { teamApi, Team, TeamRequest } from './team.api';

interface EditTeamScreenProps {
  team: Team;
  onBack: () => void;
  onSuccess: (updated: Team) => void;
}

export default function EditTeamScreen({ team, onBack, onSuccess }: EditTeamScreenProps) {
  const [form, setForm] = useState<TeamRequest>({
    name: team.name || '',
    description: team.description || '',
    joinCode: team.joinCode || '',
    departmentId: team.departmentId || 1,
    isApprovalRequired: team.isApprovalRequired || false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key: keyof TeamRequest, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: key === 'departmentId' ? Number(value) : value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Lỗi', 'Tên lớp học không được để trống');
      return;
    }
    setLoading(true);
    try {
      const updated = await teamApi.update(team.id, form);
      onSuccess(updated);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin lớp học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sửa thông tin lớp học</Text>
      <Text style={styles.label}>Tên lớp học *</Text>
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={v => handleChange('name', v)}
        placeholder="VD: Toán Cao Cấp - Lớp B"
      />
      <Text style={styles.label}>Mô tả</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={form.description}
        onChangeText={v => handleChange('description', v)}
        placeholder="Nhập mô tả chi tiết về lớp học..."
        multiline
      />
      <View style={styles.switchContainer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchTitle}>Yêu cầu duyệt khi tham gia</Text>
          <Text style={styles.switchSubtitle}>
            Thành viên mới phải được Trưởng lớp phê duyệt mới có thể vào lớp.
          </Text>
        </View>
        <Switch
          value={form.isApprovalRequired}
          onValueChange={v => handleChange('isApprovalRequired', v)}
          trackColor={{ false: '#cbd5e1', true: '#1868f0' }}
          thumbColor={form.isApprovalRequired ? '#ffffff' : '#f8fafc'}
        />
      </View>
      
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Lưu thay đổi</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
        <Text style={styles.cancelText}>Hủy</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 24, color: '#1e293b' },
  label: { fontSize: 15, color: '#334155', marginTop: 16, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#f8fafc' },
  switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9', marginTop: 24 },
  switchTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  switchSubtitle: { fontSize: 13, color: '#64748b', lineHeight: 18, paddingRight: 16 },
  button: { backgroundColor: '#1868f0', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 28 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { alignItems: 'center', marginTop: 18 },
  cancelText: { color: '#64748b', fontSize: 15 },
});
