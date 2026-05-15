import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";

import { assignmentApi } from "../assignment.api";
import {
  AssignmentType,
  QuestionType,
  type CreateAssignmentPayload,
  type QuestionOptionRequest,
  type QuestionRequest,
} from "../assignment.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateAssignmentScreenProps = {
  /** The team this assignment belongs to — pre-filled and hidden */
  teamId: number;
  /** Optional: displayed in header subtitle */
  teamTitle?: string;
  onBack: () => void;
  onSuccess: () => void;
};

type LocalOption = {
  content: string;
  isCorrect: boolean;
};

type LocalQuestion = {
  content: string;
  type: QuestionType;
  points: string; // string for TextInput
  options: LocalOption[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.SINGLE_CHOICE]: "1 đáp án",
  [QuestionType.MULTI_CHOICE]: "Nhiều đáp án",
  [QuestionType.TRUE_FALSE]: "Đúng / Sai",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

function StyledInput(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor="#94a3b8"
      style={[styles.input, props.multiline && styles.inputMultiline]}
      {...props}
    />
  );
}

// ─── Quiz builder sub-component ───────────────────────────────────────────────

function QuestionBuilder({
  questions,
  onChange,
}: {
  questions: LocalQuestion[];
  onChange: (q: LocalQuestion[]) => void;
}) {
  const addQuestion = () => {
    onChange([
      ...questions,
      {
        content: "",
        type: QuestionType.SINGLE_CHOICE,
        points: "1",
        options: [
          { content: "", isCorrect: true },
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
        ],
      },
    ]);
  };

  const removeQuestion = (qi: number) => {
    onChange(questions.filter((_, i) => i !== qi));
  };

  const updateQuestion = (qi: number, patch: Partial<LocalQuestion>) => {
    onChange(questions.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  };

  const updateOption = (qi: number, oi: number, patch: Partial<LocalOption>) => {
    onChange(
      questions.map((q, i) => {
        if (i !== qi) return q;
        const nextOptions = q.options.map((opt, j) => {
          if (j !== oi) return opt;
          return { ...opt, ...patch };
        });
        // For single/true-false: deselect others when setting isCorrect
        if (patch.isCorrect && q.type !== QuestionType.MULTI_CHOICE) {
          return {
            ...q,
            options: nextOptions.map((opt, j) =>
              j === oi ? opt : { ...opt, isCorrect: false }
            ),
          };
        }
        return { ...q, options: nextOptions };
      })
    );
  };

  return (
    <View style={styles.qBuilderWrap}>
      {questions.map((q, qi) => (
        <View key={qi} style={styles.qCard}>
          {/* Question header */}
          <View style={styles.qCardHeader}>
            <Text style={styles.qCardLabel}>Câu {qi + 1}</Text>
            <TouchableOpacity onPress={() => removeQuestion(qi)}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* Question content */}
          <StyledInput
            placeholder="Nội dung câu hỏi..."
            value={q.content}
            onChangeText={(v) => updateQuestion(qi, { content: v })}
            multiline
            numberOfLines={3}
          />

          {/* Question type + points row */}
          <View style={styles.qMetaRow}>
            {/* Type picker (cycle through types) */}
            <TouchableOpacity
              style={styles.qTypePicker}
              onPress={() => {
                const types = Object.values(QuestionType);
                const nextIdx =
                  (types.indexOf(q.type) + 1) % types.length;
                updateQuestion(qi, { type: types[nextIdx] });
              }}
            >
              <Ionicons name="swap-horizontal-outline" size={14} color="#4f46e5" />
              <Text style={styles.qTypeText}>
                {QUESTION_TYPE_LABELS[q.type]}
              </Text>
            </TouchableOpacity>

            {/* Points */}
            <View style={styles.qPointsRow}>
              <Ionicons name="star-outline" size={14} color="#64748b" />
              <TextInput
                style={styles.qPointsInput}
                value={q.points}
                onChangeText={(v) => updateQuestion(qi, { points: v })}
                keyboardType="numeric"
                maxLength={4}
                placeholderTextColor="#94a3b8"
                placeholder="1"
              />
              <Text style={styles.qPointsLabel}>điểm</Text>
            </View>
          </View>

          {/* Options */}
          <View style={styles.optionsWrap}>
            {q.options.map((opt, oi) => (
              <View key={oi} style={styles.optionRow}>
                {/* Correct toggle */}
                <TouchableOpacity
                  style={[
                    styles.optionMarker,
                    opt.isCorrect && styles.optionMarkerCorrect,
                  ]}
                  onPress={() => updateOption(qi, oi, { isCorrect: !opt.isCorrect })}
                >
                  {opt.isCorrect && (
                    <Ionicons name="checkmark" size={12} color="#ffffff" />
                  )}
                </TouchableOpacity>

                {/* Option text */}
                <TextInput
                  style={styles.optionInput}
                  placeholder={`Lựa chọn ${String.fromCharCode(65 + oi)}...`}
                  placeholderTextColor="#94a3b8"
                  value={opt.content}
                  onChangeText={(v) => updateOption(qi, oi, { content: v })}
                />
              </View>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addQBtn} onPress={addQuestion}>
        <Ionicons name="add-circle-outline" size={18} color="#4f46e5" />
        <Text style={styles.addQBtnText}>Thêm câu hỏi</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CreateAssignmentScreen({
  teamId,
  onBack,
  onSuccess,
}: CreateAssignmentScreenProps) {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [type, setType] = useState<AssignmentType>(AssignmentType.ESSAY);
  const [dueDate, setDueDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [maxScore, setMaxScore] = useState("10");
  const [maxAttempts, setMaxAttempts] = useState("");
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // ─── Date picker ──────────────────────────────────────────────────────────

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(Platform.OS === "ios"); // keep open on iOS
    if (selected) setDueDate(selected);
  };

  // ─── Validation & Submit ──────────────────────────────────────────────────

  const validate = (): string | null => {
    if (!title.trim()) return "Vui lòng nhập tiêu đề bài tập.";
    const score = parseFloat(maxScore);
    if (isNaN(score) || score < 1 || score > 1000)
      return "Điểm tối đa phải từ 1 đến 1000.";
    if (dueDate <= new Date()) return "Hạn nộp phải ở tương lai.";
    if (type === AssignmentType.QUIZ && questions.length === 0)
      return "QUIZ phải có ít nhất 1 câu hỏi.";
    return null;
  };

  const buildQuestionsPayload = (): QuestionRequest[] => {
    return questions.map((q, qi) => ({
      content: q.content.trim() || `Câu hỏi ${qi + 1}`,
      type: q.type,
      points: parseFloat(q.points) || 1,
      displayOrder: qi + 1,
      options: q.options
        .filter((o) => o.content.trim().length > 0)
        .map((o, oi) => ({
          content: o.content.trim(),
          isCorrect: o.isCorrect,
          displayOrder: oi + 1,
        })) as QuestionOptionRequest[],
    }));
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Kiểm tra lại", err);
      return;
    }

    const payload: CreateAssignmentPayload = {
      title: title.trim(),
      instructions: instructions.trim() || undefined,
      type,
      dueDate: dueDate.toISOString().replace("Z", ""),
      maxScore: parseFloat(maxScore),
      teamIds: [teamId],
      ...(type === AssignmentType.QUIZ && maxAttempts
        ? { maxAttempts: parseInt(maxAttempts, 10) }
        : {}),
      ...(type === AssignmentType.QUIZ
        ? { questions: buildQuestionsPayload() }
        : {}),
    };

    try {
      setSubmitting(true);
      await assignmentApi.createAssignment(payload);
      Alert.alert("Thành công", "Đã tạo bài tập mới!", [
        { text: "OK", onPress: onSuccess },
      ]);
    } catch (apiError) {
      Alert.alert(
        "Lỗi",
        apiError instanceof Error ? apiError.message : "Không thể tạo bài tập."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo bài tập mới</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Basic Info ─── */}
          <SectionHeader title="Thông tin cơ bản" />

          <FieldLabel label="Tiêu đề" required />
          <StyledInput
            placeholder="VD: Kiểm tra giữa kỳ Toán..."
            value={title}
            onChangeText={setTitle}
            maxLength={255}
          />

          <FieldLabel label="Mô tả / Hướng dẫn" />
          <StyledInput
            placeholder="Nhập hướng dẫn làm bài (tùy chọn)..."
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={4}
            maxLength={2000}
          />

          {/* ─── Type picker ─── */}
          <FieldLabel label="Loại bài tập" required />
          <View style={styles.typeRow}>
            {[AssignmentType.ESSAY, AssignmentType.QUIZ].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                onPress={() => setType(t)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={
                    t === AssignmentType.ESSAY
                      ? "document-text-outline"
                      : "help-circle-outline"
                  }
                  size={18}
                  color={type === t ? "#4f46e5" : "#64748b"}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    type === t && styles.typeBtnTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ─── Scoring ─── */}
          <SectionHeader title="Điểm số & Thời hạn" />

          <View style={styles.rowFields}>
            <View style={styles.rowFieldItem}>
              <FieldLabel label="Điểm tối đa" required />
              <StyledInput
                placeholder="10"
                value={maxScore}
                onChangeText={setMaxScore}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            {type === AssignmentType.QUIZ && (
              <View style={styles.rowFieldItem}>
                <FieldLabel label="Số lần làm (0=∞)" />
                <StyledInput
                  placeholder="Không giới hạn"
                  value={maxAttempts}
                  onChangeText={setMaxAttempts}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            )}
          </View>

          {/* Due date */}
          <FieldLabel label="Hạn nộp bài" required />
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={18} color="#4f46e5" />
            <Text style={styles.datePickerText}>
              {format(dueDate, "dd/MM/yyyy HH:mm")}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode={Platform.OS === "ios" ? "datetime" : "date"}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onChange={onDateChange}
            />
          )}

          {/* ─── Quiz Builder ─── */}
          {type === AssignmentType.QUIZ && (
            <>
              <SectionHeader title="Câu hỏi Quiz" />
              <QuestionBuilder questions={questions} onChange={setQuestions} />
            </>
          )}

          {/* ─── Submit ─── */}
          <Pressable
            style={[
              styles.submitBtn,
              submitting && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" />
                <Text style={styles.submitBtnText}>Tạo bài tập</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },

  // Scroll
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 14,
  },
  sectionBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: "#4f46e5",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Fields
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    marginTop: 12,
  },
  required: { color: "#ef4444" },

  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0f172a",
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: "top",
    paddingTop: 12,
  },

  // Type row
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  typeBtnActive: {
    borderColor: "#c7d2fe",
    backgroundColor: "#eef2ff",
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  typeBtnTextActive: {
    color: "#4f46e5",
  },

  // Row fields (side by side)
  rowFields: {
    flexDirection: "row",
    gap: 12,
  },
  rowFieldItem: {
    flex: 1,
  },

  // Date picker button
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  datePickerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },

  // Quiz builder
  qBuilderWrap: { gap: 14 },
  qCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    padding: 16,
    gap: 10,
  },
  qCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qCardLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4f46e5",
    letterSpacing: 0.3,
  },
  qMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  qTypePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
  },
  qTypeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4f46e5",
  },
  qPointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  qPointsInput: {
    width: 36,
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  qPointsLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  optionsWrap: { gap: 8, marginTop: 4 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  optionMarkerCorrect: {
    borderColor: "#10b981",
    backgroundColor: "#10b981",
  },
  optionInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: "#0f172a",
  },
  addQBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#c7d2fe",
    borderStyle: "dashed",
    backgroundColor: "#eef2ff",
  },
  addQBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4f46e5",
  },

  // Submit
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#4f46e5",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
});
