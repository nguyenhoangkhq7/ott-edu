import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { format, isPast, isValid } from "date-fns";
import { formatDisplayFileName } from "../../../shared/utils/file";

import { assignmentApi, type ViewSubmission } from "../assignment.api";
import {
  AssignmentType,
  SubmissionStatus,
  type AssignmentDetail,
  type GradeDetails,
  type Submission,
} from "../assignment.types";

import GradeResultCard from "../components/GradeResultCard";
import SubmitEssayComponent from "../components/SubmitEssayComponent";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssignmentDetailScreenProps = {
  assignmentId: number;
  onBack: () => void;
  /** Called when student taps "ẮĐU BẸ" on a QUIZ — parent handles quiz navigation */
  onStartQuiz: (detail: AssignmentDetail, submissionId?: number) => void;
  /** Called when student wants to review their quiz submission */
  onReviewQuiz: (detail: AssignmentDetail, submission: ViewSubmission) => void;
};

// Discriminated union for all possible student states
type StudentView =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "graded"; detail: AssignmentDetail; submission: ViewSubmission; grade: GradeDetails }
  | { kind: "submitted"; detail: AssignmentDetail; submission: ViewSubmission }
  | { kind: "pending_essay"; detail: AssignmentDetail; hasDraft?: boolean }
  | { kind: "pending_quiz"; detail: AssignmentDetail; submissionId?: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value?: string): string {
  if (!value) return "Không có hạn";
  const d = new Date(value);
  return isValid(d) ? format(d, "HH:mm · dd/MM/yyyy") : value;
}

function getDueDateColor(dueDate: string): string {
  const d = new Date(dueDate);
  if (!isValid(d)) return "#64748b";
  const diffMs = d.getTime() - Date.now();
  if (isPast(d)) return "#ef4444";
  if (diffMs < 86_400_000 * 2) return "#f59e0b"; // < 48 hours
  return "#10b981";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaChip({
  icon,
  label,
  color = "#64748b",
  bgColor = "#f1f5f9",
}: {
  icon: string;
  label: string;
  color?: string;
  bgColor?: string;
}) {
  return (
    <View style={[styles.metaChip, { backgroundColor: bgColor }]}>
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={[styles.metaChipText, { color }]}>{label}</Text>
    </View>
  );
}

/** "Awaiting grading" state card */
function AwaitingGradingCard({ submittedAt }: { submittedAt?: string }) {
  const pulse = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={styles.awaitingCard}>
      <Animated.View
        style={[styles.awaitingIconWrap, { transform: [{ scale: pulse }] }]}
      >
        <Ionicons name="hourglass-outline" size={32} color="#4f46e5" />
      </Animated.View>
      <Text style={styles.awaitingTitle}>Bài đã được nộp!</Text>
      <Text style={styles.awaitingDesc}>
        Giáo viên đang xem xét bài của bạn. Kết quả sẽ được thông báo sớm.
      </Text>
      {submittedAt && (
        <View style={styles.awaitingTimestamp}>
          <Ionicons name="time-outline" size={12} color="#6366f1" />
          <Text style={styles.awaitingTimestampText}>
            Đã nộp lúc {formatDate(submittedAt)}
          </Text>
        </View>
      )}
    </View>
  );
}

/** Quiz CTA button */
function StartQuizCard({
  detail,
  onStart,
}: {
  detail: AssignmentDetail;
  onStart: () => void;
}) {
  const questionCount = detail.questions?.length ?? 0;

  return (
    <View style={styles.quizCard}>
      <View style={styles.quizCardTop}>
        <View style={styles.quizIconWrap}>
          <Ionicons name="help-circle-outline" size={28} color="#4f46e5" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.quizCardTitle}>Bài kiểm tra trắc nghiệm</Text>
          {questionCount > 0 && (
            <Text style={styles.quizCardMeta}>
              {questionCount} câu hỏi · Tối đa {detail.maxScore} điểm{detail.timeLimit ? ` · ${detail.timeLimit} phút` : " · Không giới hạn"}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.quizHints}>
        {[
          "Đọc kỹ câu hỏi trước khi trả lời",
          "Không thoát khỏi bài khi đang làm",
          "Kết quả được tính ngay khi nộp",
        ].map((hint) => (
          <View key={hint} style={styles.quizHintRow}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={styles.quizHintText}>{hint}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.startQuizBtn}
        onPress={onStart}
        activeOpacity={0.85}
      >
        <Ionicons name="play-circle-outline" size={20} color="#ffffff" />
        <Text style={styles.startQuizBtnText}>Bắt đầu làm bài</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AssignmentDetailScreen({
  assignmentId,
  onBack,
  onStartQuiz,
  onReviewQuiz,
}: AssignmentDetailScreenProps) {
  const [view, setView] = useState<StudentView>({ kind: "loading" });

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      setView({ kind: "loading" });

      const [detail, submission] = await Promise.all([
        assignmentApi.getAssignmentDetail(assignmentId),
        assignmentApi.getCurrentSubmission(assignmentId),
      ]);

      if (!submission) {
        if (detail.type === AssignmentType.ESSAY) {
          setView({ kind: "pending_essay", detail, hasDraft: false });
        } else {
          setView({ kind: "pending_quiz", detail });
        }
        return;
      }

      const submissionId = (submission.id ?? submission.submissionId) as number;

      // Backend keeps status=SUBMITTED even after grading.
      // Detect GRADED state by checking if grade object is present.
      const gradeData = submission.grade as unknown as GradeDetails | null | undefined;
      if (gradeData && typeof gradeData === "object" && "score" in gradeData) {
        setView({ kind: "graded", detail, submission, grade: gradeData });
        return;
      }

      // status=GRADED (explicit) — also try fetching grade via dedicated endpoint
      if (submission.status === SubmissionStatus.GRADED) {
        try {
          const grade = await assignmentApi.getMyGrade(submissionId);
          setView({ kind: "graded", detail, submission, grade });
        } catch {
          setView({ kind: "submitted", detail, submission });
        }
        return;
      }

      if (submission.status === SubmissionStatus.SUBMITTED) {
        setView({ kind: "submitted", detail, submission });
        return;
      }

      // DRAFT status
      if (detail.type === AssignmentType.ESSAY) {
        setView({ kind: "pending_essay", detail, hasDraft: true });
      } else {
        setView({ kind: "pending_quiz", detail, submissionId });
      }
    } catch (err) {
      setView({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Không thể tải bài tập. Vui lòng thử lại.",
      });
    }
  }, [assignmentId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // After essay is submitted, refresh to show "awaiting" card
  const handleEssaySuccess = useCallback(() => {
    void loadData();
  }, [loadData]);

  // ─── Assignment detail header (used in all non-loading states) ─────────────

  const renderHeader = (detail: AssignmentDetail) => {
    const typeConfig =
      detail.type === AssignmentType.QUIZ
        ? { icon: "help-circle-outline", color: "#4f46e5", bg: "#eef2ff", label: "QUIZ" }
        : { icon: "document-text-outline", color: "#d97706", bg: "#fef3c7", label: "ESSAY" };

    const dueDateColor = getDueDateColor(detail.dueDate);
    const isOverdue = isPast(new Date(detail.dueDate));

    return (
      <View style={styles.detailHeader}>
        {/* Type + Overdue badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }]}>
            <Ionicons
              name={typeConfig.icon as any}
              size={12}
              color={typeConfig.color}
            />
            <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
              {typeConfig.label}
            </Text>
          </View>
          {isOverdue && (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueBadgeText}>Đã quá hạn</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.assignmentTitle}>{detail.title}</Text>

        {/* Meta chips */}
        <View style={styles.metaRow}>
          <MetaChip
            icon="time-outline"
            label={formatDate(detail.dueDate)}
            color={dueDateColor}
            bgColor={dueDateColor + "18"}
          />
          <MetaChip
            icon="star-outline"
            label={`Tối đa ${detail.maxScore} điểm`}
          />
          {detail.questions?.length > 0 && (
            <MetaChip
              icon="list-outline"
              label={`${detail.questions.length} câu hỏi`}
            />
          )}
          {detail.type === AssignmentType.QUIZ && (
            <MetaChip
              icon="stopwatch-outline"
              label={detail.timeLimit ? `${detail.timeLimit} phút` : "Không giới hạn"}
              color="#6366f1"
              bgColor="#eef2ff"
            />
          )}
        </View>

        {/* Instructions */}
        {!!detail.instructions && (
          <View style={styles.instructionsBox}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="book-outline" size={14} color="#475569" />
              <Text style={styles.instructionsTitle}>Hướng dẫn</Text>
            </View>
            <Text style={styles.instructionsText}>{detail.instructions}</Text>
          </View>
        )}

        {/* Materials */}
        {detail.materialUrls && detail.materialUrls.length > 0 && (
          <View style={styles.materialsBox}>
            <View style={styles.materialsHeader}>
              <Ionicons name="attach-outline" size={14} color="#475569" />
              <Text style={styles.materialsTitle}>Tài liệu tham khảo ({detail.materialUrls.length})</Text>
            </View>
            <View style={styles.materialsList}>
              {detail.materialUrls.map((url, idx) => {
                const cleanedName = formatDisplayFileName(url, `Tài liệu ${idx + 1}`);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.materialItem}
                    onPress={() => {
                      Linking.openURL(url).catch(() =>
                        Alert.alert("Lỗi", "Không thể mở tài liệu.")
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="document-text-outline" size={16} color="#3b82f6" />
                    <Text style={styles.materialText} numberOfLines={1}>
                      {cleanedName}
                    </Text>
                    <Ionicons name="open-outline" size={14} color="#94a3b8" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  // ─── Render states ────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (view.kind) {
      case "loading":
        return (
          <View style={styles.centeredFlex}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.loadingText}>Đang tải bài tập...</Text>
          </View>
        );

      case "error":
        return (
          <View style={styles.centeredFlex}>
            <View style={styles.errorIconWrap}>
              <Ionicons name="cloud-offline-outline" size={40} color="#ef4444" />
            </View>
            <Text style={styles.errorTitle}>Không thể tải bài tập</Text>
            <Text style={styles.errorDesc}>{view.message}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
              <Ionicons name="refresh-outline" size={16} color="#4f46e5" />
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        );

      case "graded":
        return (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderHeader(view.detail)}
            <View style={styles.sectionLabel}>
              <Ionicons name="ribbon-outline" size={14} color="#4f46e5" />
              <Text style={styles.sectionLabelText}>KẾT QUẢ</Text>
            </View>
            <GradeResultCard
              grade={view.grade}
              maxScore={view.detail.maxScore}
            />
            {view.detail.type === AssignmentType.QUIZ && (
              <TouchableOpacity
                style={styles.reviewBtn}
                onPress={() => onReviewQuiz(view.detail, view.submission)}
              >
                <Ionicons name="eye-outline" size={18} color="#4f46e5" />
                <Text style={styles.reviewBtnText}>Xem lại bài làm</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        );

      case "submitted":
        return (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderHeader(view.detail)}
            <View style={styles.sectionLabel}>
              <Ionicons name="hourglass-outline" size={14} color="#6366f1" />
              <Text style={styles.sectionLabelText}>TRẠNG THÁI</Text>
            </View>
            <AwaitingGradingCard submittedAt={view.submission.submittedAt ?? undefined} />
            {view.detail.type === AssignmentType.QUIZ && (
              <TouchableOpacity
                style={styles.reviewBtn}
                onPress={() => onReviewQuiz(view.detail, view.submission)}
              >
                <Ionicons name="eye-outline" size={18} color="#6366f1" />
                <Text style={[styles.reviewBtnText, { color: "#6366f1" }]}>Xem lại bài làm</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        );

      case "pending_essay":
        return (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderHeader(view.detail)}
            <View style={styles.sectionLabel}>
              <Ionicons name="cloud-upload-outline" size={14} color="#f59e0b" />
              <Text style={styles.sectionLabelText}>NỘP BÀI</Text>
            </View>
            <SubmitEssayComponent
              assignmentId={assignmentId}
              teamId={view.detail.teamIds[0]}
              hasDraft={view.hasDraft}
              onSubmitSuccess={handleEssaySuccess}
            />
          </ScrollView>
        );

      case "pending_quiz":
        return (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderHeader(view.detail)}
            <View style={styles.sectionLabel}>
              <Ionicons name="play-circle-outline" size={14} color="#4f46e5" />
              <Text style={styles.sectionLabelText}>LÀM BÀI</Text>
            </View>
            <StartQuizCard
              detail={view.detail}
              onStart={() => onStartQuiz(view.detail, view.submissionId)}
            />
          </ScrollView>
        );
    }
  };

  // ─── Screen ───────────────────────────────────────────────────────────────

  const headerTitle =
    view.kind === "loading" || view.kind === "error"
      ? "Chi tiết bài tập"
      : view.kind === "graded" || view.kind === "submitted" || view.kind === "pending_essay" || view.kind === "pending_quiz"
      ? view.detail.title
      : "Chi tiết bài tập";

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      {/* Screen header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.screenHeaderTitle} numberOfLines={1}>
          {headerTitle}
        </Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
          <Ionicons name="refresh-outline" size={18} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>{renderContent()}</View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Screen header
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  screenHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Scroll
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },

  // Detail header card
  detailHeader: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  overdueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#fee2e2",
  },
  overdueBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#b91c1c",
  },
  assignmentTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  instructionsBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 4,
  },
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  instructionsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  instructionsText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 22,
  },
  materialsBox: {
    marginTop: 12,
    gap: 8,
  },
  materialsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  materialsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  materialsList: {
    gap: 8,
    marginTop: 4,
  },
  materialItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  materialText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
    textDecorationLine: "underline",
  },

  // Section label
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1,
  },

  // Awaiting grading card
  awaitingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    padding: 28,
    alignItems: "center",
    gap: 12,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  awaitingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  awaitingTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },
  awaitingDesc: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
  },
  awaitingTimestamp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
  },
  awaitingTimestampText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4f46e5",
  },

  // Quiz CTA card
  quizCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quizCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  quizIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  quizCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  quizCardMeta: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 3,
  },
  quizHints: {
    gap: 8,
    paddingHorizontal: 4,
  },
  quizHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  quizHintText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  startQuizBtn: {
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
  startQuizBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.2,
  },

  // Loading / Error
  centeredFlex: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#475569",
  },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  errorDesc: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4f46e5",
  },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  reviewBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4f46e5",
  },
});
