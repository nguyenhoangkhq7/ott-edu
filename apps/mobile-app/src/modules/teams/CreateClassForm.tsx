import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SelectModal, { SelectOption } from '../../shared/ui/SelectModal';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface FormData {
  name: string;
  description: string;
  department: string;
  maxStudents: string;
}

export interface CreateClassFormProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: (className: string) => void;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const DEPARTMENT_OPTIONS: SelectOption[] = [
  { label: 'Mathematics', value: 'Mathematics' },
  { label: 'Physics', value: 'Physics' },
  { label: 'Chemistry', value: 'Chemistry' },
  { label: 'Biology', value: 'Biology' },
  { label: 'Computer Science', value: 'Computer Science' },
  { label: 'Literature', value: 'Literature' },
  { label: 'History', value: 'History' },
];

const INITIAL_FORM: FormData = {
  name: '',
  description: '',
  department: '',
  maxStudents: '50',
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function CreateClassForm({
  visible,
  onClose,
  onCreated,
}: CreateClassFormProps) {
   const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
   const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
   const [isLoading, setIsLoading] = useState(false);
   const [showDeptModal, setShowDeptModal] = useState(false);
   const [showSuccessModal, setShowSuccessModal] = useState(false);
   const [createdClassName, setCreatedClassName] = useState('');

  // ── Helpers ──

  const update = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const reset = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = 'Class name is required';
    if (!formData.department) newErrors.department = 'Department is required';
    const maxNum = parseInt(formData.maxStudents, 10);
    if (!formData.maxStudents || isNaN(maxNum) || maxNum < 1) {
      newErrors.maxStudents = 'Must be at least 1';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCreatedClassName(formData.name);
      setShowSuccessModal(true);
    } catch (e) {
      console.error('Error creating class:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDone = () => {
    setShowSuccessModal(false);
    onCreated?.(createdClassName || formData.name);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ── Render ──
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerBtn} activeOpacity={0.6}>
            <Ionicons name="close" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create a class</Text>
          <View style={styles.headerBtn} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Avatar Placeholder ── */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <MaterialCommunityIcons name="camera-plus-outline" size={38} color="#cbd5e1" />
                <TouchableOpacity style={styles.editBadge} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="pencil" size={14} color="white" />
                </TouchableOpacity>
              </View>
              <Text style={styles.avatarLabel}>Class Avatar</Text>
              <Text style={styles.avatarSub}>
                Recommended size: 512×512px
              </Text>
            </View>

            {/* ── Form Fields ── */}
            <View style={styles.form}>

              {/* Name */}
              <FormField label="Class Name" required error={errors.name}>
                <TextInput
                  style={[styles.input, !!errors.name && styles.inputError]}
                  placeholder="e.g., Java Programming - K65"
                  placeholderTextColor="#cbd5e1"
                  value={formData.name}
                  onChangeText={v => update('name', v)}
                  maxLength={100}
                />
              </FormField>

              {/* Description */}
              <FormField label="Description" hint="Optional">
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell your students what this class is about..."
                  placeholderTextColor="#cbd5e1"
                  value={formData.description}
                  onChangeText={v => update('description', v)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={300}
                />
              </FormField>

              {/* Department */}
              <FormField label="Department" required error={errors.department}>
                <TouchableOpacity
                  style={[styles.input, styles.selectRow, !!errors.department && styles.inputError]}
                  onPress={() => setShowDeptModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selectText, !formData.department && styles.selectPlaceholder]}>
                    {formData.department || 'Select a department'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#94a3b8" />
                </TouchableOpacity>
              </FormField>

              {/* Max Students */}
              <FormField label="Max Students" required error={errors.maxStudents}>
                <TextInput
                  style={[styles.input, !!errors.maxStudents && styles.inputError]}
                  placeholder="e.g., 50"
                  placeholderTextColor="#cbd5e1"
                  value={formData.maxStudents}
                  onChangeText={v => update('maxStudents', v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </FormField>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={18} color="#4f46e5" style={{ marginRight: 10, marginTop: 1 }} />
                <Text style={styles.infoText}>
                  By creating this class, you will be automatically assigned as the Primary Instructor. You can invite colleagues and students once the setup is complete.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createBtn, (!formData.name || isLoading) && styles.btnDisabled]}
            onPress={handleCreate}
            disabled={!formData.name || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={18} color="white" />
                <Text style={styles.createBtnText}>Create Class</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Department SelectModal ── */}
        <SelectModal
          visible={showDeptModal}
          title="Select Department"
          options={DEPARTMENT_OPTIONS}
          selectedValue={formData.department}
          searchPlaceholder="Search department..."
          onSelect={v => { update('department', v); }}
          onClose={() => setShowDeptModal(false)}
        />

        {/* ── Success Modal ── */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={handleDone}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successContainer}>
              {/* Green accent bar */}
              <View style={styles.successAccentBar} />

              {/* Icon */}
              <View style={styles.successIconWrap}>
                <View style={styles.successOuterCircle}>
                  <View style={styles.successInnerCircle}>
                    <Ionicons name="checkmark" size={32} color="white" />
                  </View>
                </View>
                <View style={[styles.dot, { top: 8, right: -4, backgroundColor: '#bfdbfe' }]} />
                <View style={[styles.dot, { bottom: 16, left: -10, backgroundColor: '#bbf7d0', width: 14, height: 14, borderRadius: 7 }]} />
              </View>

              <Text style={styles.successTitle}>Your class is ready!</Text>
              <Text style={styles.successSubtitle}>
                <Text style={styles.successBold}>"{formData.name}"</Text>
                {' '}has been successfully created. You can now start managing your curriculum and inviting students.
              </Text>

              <TouchableOpacity style={styles.successPrimaryBtn} onPress={handleDone} activeOpacity={0.85}>
                <Text style={styles.successPrimaryBtnText}>Go to Class</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.successSecondaryBtn} activeOpacity={0.7}>
                <Ionicons name="person-add-outline" size={18} color="#1e293b" />
                <Text style={styles.successSecondaryBtnText}>Add Members now</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDone} style={{ paddingVertical: 10 }} activeOpacity={0.7}>
                <Text style={styles.laterText}>Maybe later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Sub-component: FormField
// ─────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function FormField({ label, required, error, hint, children }: FormFieldProps) {
  return (
    <View style={fieldStyles.wrapper}>
      <View style={fieldStyles.labelRow}>
        <Text style={fieldStyles.label}>
          {label}
          {required && <Text style={fieldStyles.required}> *</Text>}
        </Text>
        {hint && <Text style={fieldStyles.hint}>{hint}</Text>}
      </View>
      {children}
      {error && <Text style={fieldStyles.error}>{error}</Text>}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569' },
  required: { color: '#ef4444' },
  hint: { fontSize: 12, color: '#94a3b8' },
  error: { fontSize: 12, color: '#ef4444', marginTop: 5 },
});

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', flex: 1, textAlign: 'center' },

  // Scroll
  scrollContent: { padding: 20, paddingBottom: 16 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fcfcfe',
    marginBottom: 14,
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: '#4f46e5',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'white',
  },
  avatarLabel: { fontSize: 15, fontWeight: '700', color: '#334155', marginBottom: 4 },
  avatarSub: { fontSize: 12, color: '#94a3b8' },

  // Form
  form: {},
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1e293b',
  },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
  textArea: { height: 100, paddingTop: 13, textAlignVertical: 'top' },
  selectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: 15, color: '#1e293b', flex: 1 },
  selectPlaceholder: { color: '#cbd5e1' },

  // Info box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f5f7ff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 18 },

  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  createBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
  },
  createBtnText: { fontSize: 14, fontWeight: '700', color: 'white' },
  btnDisabled: { backgroundColor: '#e2e8f0' },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // Success Modal
  successContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  successAccentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: '#22c55e',
  },
  successIconWrap: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successOuterCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 10, textAlign: 'center' },
  successSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  successBold: { color: '#334155', fontWeight: '700' },
  successPrimaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 10,
  },
  successPrimaryBtnText: { fontSize: 15, fontWeight: '700', color: 'white' },
  successSecondaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 4,
  },
  successSecondaryBtnText: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  laterText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
});