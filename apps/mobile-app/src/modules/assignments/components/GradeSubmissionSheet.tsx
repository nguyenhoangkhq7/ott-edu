import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { assignmentApi } from "../assignment.api";
import type { SubmissionGradingItem } from "../assignment.types";
import { formatDisplayFileName } from "../../../shared/utils/file";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GradeSubmissionSheetProps = {
  visible: boolean;
  submission: SubmissionGradingItem;
  studentName?: string;
  /** Max score of the assignment — used for validation */
  maxScore: number;
  onClose: () => void;
  onSuccess: () => void;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function GradeSubmissionSheet({
  visible,
  submission,
  studentName,
  maxScore,
  onClose,
  onSuccess,
}: GradeSubmissionSheetProps) {
  const [score, setScore] = useState(
    submission.currentScore !== null ? String(submission.currentScore) : ""
  );
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Animated slide-up
  const slideY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, {
        toValue: 0,
        damping: 22,
        stiffness: 180,
        useNativeDriver: true,
      }).start();
    } else {
      slideY.setValue(400);
    }
  }, [visible, slideY]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleOpenFile = () => {
    if (!submission.fileUrl) return;
    Linking.openURL(submission.fileUrl).catch(() =>
      Alert.alert("Lỗi", "Không thể mở file.")
    );
  };

  const validate = (): string | null => {
    const parsed = parseFloat(score);
    if (score.trim() === "" || isNaN(parsed)) return "Vui lòng nhập điểm hợp lệ.";
    if (parsed < 0) return "Điểm không được âm.";
    if (parsed > maxScore)
      return `Điểm không được vượt quá ${maxScore}.`;
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Kiểm tra lại", err);
      return;
    }

    try {
      setSubmitting(true);
      await assignmentApi.gradeSubmission(submission.submissionId, {
        score: parseFloat(score),
        feedback: feedback.trim(),
      });
      Alert.alert("Đã lưu điểm", "Điểm của sinh viên đã được cập nhật.", [
        { text: "OK", onPress: onSuccess },
      ]);
    } catch (apiErr) {
      Alert.alert(
        "Lỗi",
        apiErr instanceof Error ? apiErr.message : "Không thể lưu điểm."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <KeyboardAvoidingView
        style={styles.kvWrap}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideY }] }]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Chấm điểm</Text>
              <Text style={styles.sheetSub}>
                {studentName || `Sinh viên #${submission.studentAccountId}`}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* ── Info chips ── */}
          <View style={styles.chipsRow}>
            {submission.isLate && (
              <View style={[styles.chip, styles.chipDanger]}>
                <Ionicons name="time-outline" size={12} color="#b91c1c" />
                <Text style={[styles.chipText, { color: "#b91c1c" }]}>
                  Nộp trễ hạn
                </Text>
              </View>
            )}
            {submission.isGraded && (
              <View style={[styles.chip, styles.chipSuccess]}>
                <Ionicons name="checkmark-circle-outline" size={12} color="#15803d" />
                <Text style={[styles.chipText, { color: "#15803d" }]}>
                  Đã chấm (điểm cũ: {submission.currentScore})
                </Text>
              </View>
            )}
          </View>

          {/* ── Essay file link ── */}
          {submission.fileUrl ? (
            <TouchableOpacity
              style={styles.fileRow}
              onPress={handleOpenFile}
              activeOpacity={0.8}
            >
              <View style={styles.fileIconWrap}>
                <Ionicons name="document-attach-outline" size={20} color="#4f46e5" />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileLabel}>File bài nộp</Text>
                <Text style={styles.fileUrl} numberOfLines={1}>
                  {formatDisplayFileName(submission.fileUrl || undefined, "File bài nộp")}
                </Text>
              </View>
              <Ionicons name="open-outline" size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : (
            <View style={styles.noFileRow}>
              <Ionicons name="alert-circle-outline" size={16} color="#94a3b8" />
              <Text style={styles.noFileText}>
                Không có file đính kèm (QUIZ hoặc chưa tải lên)
              </Text>
            </View>
          )}

          {/* ── Score input ── */}
          <View style={styles.scoreRow}>
            <View style={styles.scoreField}>
              <Text style={styles.fieldLabel}>
                Điểm <Text style={styles.maxScoreHint}>(tối đa {maxScore})</Text>
              </Text>
              <TextInput
                style={styles.scoreInput}
                value={score}
                onChangeText={setScore}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                maxLength={6}
                selectTextOnFocus
              />
            </View>

            {/* Quick-fill chips */}
            <View style={styles.quickFillCol}>
              <Text style={styles.fieldLabel}>Nhanh</Text>
              <View style={styles.quickFillRow}>
                {[100, 75, 50].map((pct) => (
                  <TouchableOpacity
                    key={pct}
                    style={styles.quickFillBtn}
                    onPress={() =>
                      setScore(String(Math.round((maxScore * pct) / 100)))
                    }
                  >
                    <Text style={styles.quickFillText}>{pct}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ── Feedback ── */}
          <Text style={styles.fieldLabel}>Nhận xét của giáo viên</Text>
          <TextInput
            style={styles.feedbackInput}
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Nhập nhận xét, góp ý cho sinh viên (tùy chọn)..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={1000}
          />

          {/* ── Submit ── */}
          <TouchableOpacity
            style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#ffffff" />
                <Text style={styles.saveBtnText}>Lưu điểm</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  kvWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
    maxHeight: "90%",
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginBottom: 16,
  },

  // Sheet header
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  sheetSub: { fontSize: 13, color: "#64748b", marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  // Chips
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipDanger: { backgroundColor: "#fee2e2" },
  chipSuccess: { backgroundColor: "#dcfce7" },
  chipText: { fontSize: 11, fontWeight: "700" },

  // File
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#eef2ff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  fileIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfo: { flex: 1 },
  fileLabel: { fontSize: 12, fontWeight: "700", color: "#4f46e5" },
  fileUrl: { fontSize: 11, color: "#64748b", marginTop: 2 },
  noFileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  noFileText: { fontSize: 12, color: "#94a3b8" },

  // Score
  scoreRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    alignItems: "flex-end",
  },
  scoreField: { flex: 1 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  maxScoreHint: { fontWeight: "400", color: "#94a3b8" },
  scoreInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#c7d2fe",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 26,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
  },
  quickFillCol: { gap: 6 },
  quickFillRow: {
    flexDirection: "row",
    gap: 6,
  },
  quickFillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
  },
  quickFillText: { fontSize: 12, fontWeight: "700", color: "#4f46e5" },

  // Feedback
  feedbackInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0f172a",
    minHeight: 100,
    marginBottom: 20,
  },

  // Save button
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#4f46e5",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: { fontSize: 16, fontWeight: "800", color: "#ffffff" },
});
