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
import { Ionicons } from '@expo/vector-icons';
import SelectModal, { SelectOption } from '../../shared/ui/SelectModal';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ClassData {
  id: string;
  name: string;
  code: string;
  description: string;
  initials: string;
  accentColor: string;
  maxStudents?: number;
  currentStudents?: number;
  department?: string;
  school?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface FormData {
  name: string;
  code: string;
  description: string;
  maxStudents: string;
  department: string;
}

export interface EditClassFormProps {
  visible: boolean;
  classData: ClassData;
  onClose: () => void;
  onSaveSuccess?: () => void;
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

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function EditClassForm({
  visible,
  classData,
  onClose,
  onSaveSuccess,
}: EditClassFormProps) {
  const initialForm: FormData = {
    name: classData.name,
    code: classData.code,
    description: classData.description,
    maxStudents: String(classData.maxStudents ?? 50),
    department: classData.department ?? '',
  };

  const [formData, setFormData] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // ── Handlers ──
  const update = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setHasChanges(false);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = 'Class name is required';
    if (!formData.code.trim()) {
      newErrors.code = 'Class code is required';
    } else if (formData.code.trim().length < 3) {
      newErrors.code = 'Class code must be at least 3 characters';
    }
    if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    const maxNum = parseInt(formData.maxStudents, 10);
    if (!formData.maxStudents || isNaN(maxNum) || maxNum < 1) {
      newErrors.maxStudents = 'Must be at least 1';
    }
    if (!formData.department) newErrors.department = 'Department is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      setShowSuccessModal(true);
      setHasChanges(false);
    } catch (e) {
      console.error('Error saving class:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmCancel = async () => {
    setShowCancelConfirm(false);
    setIsLoading(true);
    try {
      // Mock cancellation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowSuccessModal(true);
    } catch (e) {
      console.error('Error cancelling class:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const changedFields: string[] = [];
  if (formData.name !== initialForm.name) changedFields.push('Class name');
  if (formData.code !== initialForm.code) changedFields.push('Class code');
  if (formData.description !== initialForm.description) changedFields.push('Description');
  if (formData.maxStudents !== initialForm.maxStudents) changedFields.push('Max students');
  if (formData.department !== initialForm.department) changedFields.push('Department');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} activeOpacity={0.6}>
            <Ionicons name="close" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Class</Text>
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
            {/* Class Preview Card */}
            <View style={styles.previewCard}>
              <View style={[styles.previewAvatar, { backgroundColor: classData.accentColor }]}>
                <Text style={styles.previewInitials}>{classData.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewLabel}>Current Class</Text>
                <Text style={styles.previewName} numberOfLines={1}>{classData.name}</Text>
                <Text style={styles.previewCode}>Code: {classData.code}</Text>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
              {/* Class Name */}
              <FormField label="Class Name" required error={errors.name}>
                <TextInput
                  style={[styles.input, !!errors.name && styles.inputError]}
                  placeholder="e.g., Advanced Mathematics - Section B"
                  placeholderTextColor="#cbd5e1"
                  value={formData.name}
                  onChangeText={v => update('name', v)}
                  maxLength={100}
                />
              </FormField>

              {/* Class Code */}
              <FormField 
                label="Class Code" 
                required 
                error={errors.code} 
                hint="Unique identifier for this class"
              >
                <TextInput
                  style={[styles.input, styles.inputMono, !!errors.code && styles.inputError]}
                  placeholder="e.g., MATH101-B"
                  placeholderTextColor="#cbd5e1"
                  value={formData.code}
                  onChangeText={v => update('code', v.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={20}
                />
              </FormField>

              {/* Description */}
              <FormField
                label="Description"
                required
                error={errors.description}
                hint={`${formData.description.length}/500 · Min 10 characters`}
              >
                <TextInput
                  style={[styles.input, styles.textArea, !!errors.description && styles.inputError]}
                  placeholder="Describe what this class covers..."
                  placeholderTextColor="#cbd5e1"
                  value={formData.description}
                  onChangeText={v => update('description', v)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />
              </FormField>

              {/* Max Students */}
              <FormField 
                label="Max Students" 
                required 
                error={errors.maxStudents}
                hint={classData.currentStudents ? `Currently: ${classData.currentStudents} students enrolled` : undefined}
              >
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

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={18} color="#4f46e5" style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={styles.infoText}>
                  All changes will be saved. Students will be notified of name/code changes.
                </Text>
              </View>

              {/* Danger Zone */}
              <View style={styles.dangerZone}>
                <View style={styles.dangerHeader}>
                  <Ionicons name="warning-outline" size={18} color="#ef4444" />
                  <Text style={styles.dangerTitle}>Danger Zone</Text>
                </View>
                <Text style={styles.dangerText}>
                  Once you cancel a class, it will be marked as inactive. This action cannot be easily undone.
                </Text>
                <TouchableOpacity
                  style={[styles.cancelClassBtn, classData.isActive === false && styles.disabledCancelBtn]}
                  onPress={() => setShowCancelConfirm(true)}
                  disabled={classData.isActive === false}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color={classData.isActive === false ? "#94a3b8" : "#ef4444"} />
                  <Text style={[styles.cancelClassBtnText, classData.isActive === false && styles.disabledCancelBtnText]}>
                    {classData.isActive === false ? 'Class Already Cancelled' : 'Cancel This Class'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resetBtn, !hasChanges && styles.btnDisabled]}
            onPress={resetForm}
            disabled={!hasChanges}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={16} color={hasChanges ? '#475569' : '#94a3b8'} />
            <Text style={[styles.resetBtnText, !hasChanges && styles.btnTextDisabled]}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, (!hasChanges || isLoading) && styles.btnDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="white" />
                <Text style={styles.saveBtnText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Department SelectModal */}
        <SelectModal
          visible={showDeptModal}
          title="Select Department"
          options={DEPARTMENT_OPTIONS}
          selectedValue={formData.department}
          searchPlaceholder="Search department..."
          onSelect={v => { update('department', v); }}
          onClose={() => setShowDeptModal(false)}
        />

        {/* Confirm Modal */}
        <Modal
          visible={showConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmContainer}>
              <Text style={styles.confirmTitle}>Confirm changes</Text>
              <Text style={styles.confirmSubtitle}>
                Are you sure you want to save these changes?
              </Text>

              {changedFields.length > 0 && (
                <View style={styles.changedFieldsBox}>
                  <Text style={styles.changedFieldsLabel}>Fields to be updated:</Text>
                  {changedFields.map(field => (
                    <View key={field} style={styles.changedFieldRow}>
                      <Ionicons name="checkmark-circle" size={14} color="#4f46e5" />
                      <Text style={styles.changedFieldText}>{field}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={() => setShowConfirmModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmSaveBtn}
                  onPress={confirmSave}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={16} color="white" />
                  <Text style={styles.confirmSaveText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successContainer}>
              <View style={styles.successIconWrap}>
                <View style={styles.successOuterCircle}>
                  <View style={styles.successInnerCircle}>
                    <Ionicons name="checkmark" size={32} color="white" />
                  </View>
                </View>
              </View>

              <Text style={styles.successTitle}>Done!</Text>
              <Text style={styles.successSubtitle}>
                The operation was completed successfully.
              </Text>

              <TouchableOpacity
                style={styles.successPrimaryBtn}
                onPress={() => {
                  setShowSuccessModal(false);
                  onClose();
                  onSaveSuccess?.();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.successPrimaryBtnText}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Cancel Confirmation Modal */}
        <Modal
          visible={showCancelConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCancelConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmContainer}>
              <View style={[styles.successInnerCircle, { backgroundColor: '#ef4444', marginBottom: 20, alignSelf: 'center' }]}>
                <Ionicons name="alert" size={32} color="white" />
              </View>
              <Text style={styles.confirmTitle}>Cancel Class?</Text>
              <Text style={styles.confirmSubtitle}>
                This will make the class inactive for all students and teachers. Are you sure?
              </Text>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Reason for cancellation (Optional)</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="e.g., Course ended, teacher unavailable..."
                  placeholderTextColor="#cbd5e1"
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  multiline
                />
              </View>

              <View style={[styles.confirmActions, { marginTop: 20 }]}>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={() => setShowCancelConfirm(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmCancelText}>Discard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmSaveBtn, { backgroundColor: '#ef4444' }]}
                  onPress={confirmCancel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmSaveText}>Yes, Cancel Class</Text>
                </TouchableOpacity>
              </View>
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
      <Text style={fieldStyles.label}>
        {label}
        {required && <Text style={fieldStyles.required}> *</Text>}
      </Text>
      {children}
      {error ? (
        <Text style={fieldStyles.error}>{error}</Text>
      ) : hint ? (
        <Text style={fieldStyles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  required: { color: '#ef4444' },
  error: { fontSize: 12, color: '#ef4444', marginTop: 5 },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 5 },
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
    backgroundColor: '#ffffff',
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', flex: 1, textAlign: 'center' },

  // Scroll
  scrollContent: { padding: 20, paddingBottom: 24 },

  // Preview Card
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  previewAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  previewInitials: { color: 'white', fontWeight: '800', fontSize: 20 },
  previewLabel: { fontSize: 11, fontWeight: '700', color: '#4f46e5', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  previewName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  previewCode: { fontSize: 12, color: '#64748b', marginTop: 2 },

  // Form
  form: { marginBottom: 16 },
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
  inputMono: { fontVariant: ['tabular-nums'] },
  textArea: { height: 100, paddingTop: 13, textAlignVertical: 'top' },

  // Select Row
  selectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: 15, color: '#1e293b', flex: 1 },
  selectPlaceholder: { color: '#cbd5e1' },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f5f7ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
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
    backgroundColor: '#ffffff',
    gap: 10,
    alignItems: 'center',
  },
  cancelBtn: { paddingVertical: 13, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#f1f5f9' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  resetBtnText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: 'white' },
  btnDisabled: { backgroundColor: '#e2e8f0' },
  btnTextDisabled: { color: '#94a3b8' },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // Confirm Modal
  confirmContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
  },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  confirmSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 16, lineHeight: 20 },
  changedFieldsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  changedFieldsLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  changedFieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  changedFieldText: { fontSize: 13, color: '#334155' },
  confirmActions: { flexDirection: 'row', gap: 12 },
  confirmCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  confirmCancelText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  confirmSaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
  },
  confirmSaveText: { fontSize: 14, fontWeight: '700', color: 'white' },

  // Success Modal
  successContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center',
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
  successTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 10, textAlign: 'center' },
  successSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  successPrimaryBtn: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 15,
    borderRadius: 14,
  },
  successPrimaryBtnText: { fontSize: 15, fontWeight: '700', color: 'white' },

  // Danger Zone
  dangerZone: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#fee2e2',
  },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dangerTitle: { fontSize: 16, fontWeight: '700', color: '#ef4444' },
  dangerText: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 16 },
  cancelClassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
  },
  cancelClassBtnText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
  disabledCancelBtn: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  disabledCancelBtnText: { color: '#94a3b8' },

  // Confirmation modal fields
  fieldSection: { marginTop: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8 },
});
