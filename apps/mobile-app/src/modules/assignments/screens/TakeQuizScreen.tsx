import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { format, isValid } from "date-fns";

import { assignmentApi } from "../assignment.api";
import {
  QuestionType,
  type AssignmentDetail,
  type AnswerOption,
  type Question,
  type LocalAnswers,
} from "../assignment.types";
import type { ViewSubmission } from "../assignment.api";

// ─── Props ────────────────────────────────────────────────────────────────────

export type TakeQuizScreenProps = {
  /** The assignment to take (must be type=QUIZ) */
  detail: AssignmentDetail;
  /** Existing submissionId if student already started this quiz */
  existingSubmissionId?: number;
  onBack: () => void;
  onSubmitSuccess: () => void;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SubmitResult = {
  submittedAt: string;
  answeredCount: number;
  totalCount: number;
  /** Present for QUIZ auto-grade: score from submission detail */
  score?: number;
  maxScore: number;
};

type QuizPhase =
  | { kind: "starting" }
  | { kind: "taking"; submissionId: number }
  | { kind: "submitting" }
  | { kind: "result"; result: SubmitResult }
  | { kind: "error"; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, pct]);

  return (
    <View style={styles.progressBg}>
      <Animated.View
        style={[
          styles.progressFill,
          { width: anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) },
        ]}
      />
    </View>
  );
}

// ─── Option row ──────────────────────────────────────────────────────────────

function OptionRow({
  option,
  selected,
  multiChoice,
  onPress,
}: {
  option: AnswerOption;
  selected: boolean;
  multiChoice: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.optionBtn, selected && styles.optionBtnSelected]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {multiChoice ? (
          <View style={[styles.optionCheckbox, selected && styles.optionCheckboxSelected]}>
            {selected && <Ionicons name="checkmark" size={12} color="#fff" />}
          </View>
        ) : (
          <View style={[styles.optionRadio, selected && styles.optionRadioSelected]}>
            {selected && <View style={styles.optionRadioDot} />}
          </View>
        )}
        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
          {option.content}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Question card ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  total,
  answers,
  onAnswer,
}: {
  question: Question;
  index: number;
  total: number;
  answers: number[];
  onAnswer: (optionIds: number[]) => void;
}) {
  const isMulti = question.type === QuestionType.MULTI_CHOICE;

  const toggle = (optId: number) => {
    if (isMulti) {
      if (answers.includes(optId)) {
        onAnswer(answers.filter((id) => id !== optId));
      } else {
        onAnswer([...answers, optId]);
      }
    } else {
      onAnswer([optId]);
    }
  };

  return (
    <View style={styles.questionCard}>
      {/* Header */}
      <View style={styles.questionHeader}>
        <View style={styles.questionIndexBadge}>
          <Text style={styles.questionIndexText}>
            {index + 1}/{total}
          </Text>
        </View>
        <View style={styles.questionTypeBadge}>
          <Text style={styles.questionTypeText}>
            {isMulti ? "Nhiều đáp án" : question.type === QuestionType.TRUE_FALSE ? "Đúng / Sai" : "1 đáp án"}
          </Text>
        </View>
        <View style={styles.questionPointsBadge}>
          <Ionicons name="star" size={11} color="#f59e0b" />
          <Text style={styles.questionPointsText}>{question.points} điểm</Text>
        </View>
      </View>

      {/* Question text */}
      <Text style={styles.questionContent}>{question.content}</Text>

      {/* Options */}
      <View style={styles.optionsList}>
        {question.options.map((opt) => (
          <OptionRow
            key={opt.id}
            option={opt}
            selected={answers.includes(opt.id)}
            multiChoice={isMulti}
            onPress={() => toggle(opt.id)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TakeQuizScreen({
  detail,
  existingSubmissionId,
  onBack,
  onSubmitSuccess,
}: TakeQuizScreenProps) {
  const [phase, setPhase] = useState<QuizPhase>(
    existingSubmissionId
      ? { kind: "taking", submissionId: existingSubmissionId }
      : { kind: "starting" }
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<LocalAnswers>({}); // { questionId: [optionId...] }
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    detail.timeLimit ? detail.timeLimit * 60 : null
  );

  const questions = detail.questions ?? [];

  // Track latest answers in a ref to avoid dependency re-triggering for countdown doSubmit
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // ─── Start / Initialize ──────────────────────────────────────────────────

  const startQuiz = useCallback(async () => {
    setPhase({ kind: "starting" });
    try {
      const submission = await assignmentApi.startAssignment(detail.id);
      const subId = (submission.id ?? submission.submissionId) as number;
      setPhase({ kind: "taking", submissionId: subId });
    } catch (err) {
      // If already started, get the current submission
      try {
        const current = await assignmentApi.getCurrentSubmission(detail.id);
        if (current) {
          const subId = (current.id ?? current.submissionId) as number;
          // Pre-fill answers from saved draft
          const prefilled: LocalAnswers = {};
          if (current.studentAnswers) {
            for (const sa of current.studentAnswers) {
              prefilled[sa.questionId] = sa.selectedOptionIds;
            }
          }
          setAnswers(prefilled);
          setPhase({ kind: "taking", submissionId: subId });
        } else {
          throw err;
        }
      } catch {
        setPhase({
          kind: "error",
          message: err instanceof Error ? err.message : "Không thể bắt đầu bài kiểm tra.",
        });
      }
    }
  }, [detail.id]);

  useEffect(() => {
    if (phase.kind === "starting") {
      void startQuiz();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer effect
  useEffect(() => {
    if (phase.kind !== "taking") return;
    if (timeRemaining === null) return;

    const subId = phase.submissionId;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          void doSubmit(subId);
          Alert.alert("Hết giờ làm bài", "Thời gian làm bài của bạn đã hết. Hệ thống đã tự động nộp bài.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase.kind, phase.kind === "taking" ? phase.submissionId : null, timeRemaining === null]);

  // ─── Save draft (debounced when answer changes) ──────────────────────────

  const handleAnswer = useCallback(
    async (questionId: number, optionIds: number[], submissionId: number) => {
      setAnswers((prev) => ({ ...prev, [questionId]: optionIds }));
      // Fire-and-forget save-draft — don't block the UI
      assignmentApi
        .saveAnswer(submissionId, questionId, optionIds)
        .catch((e) => console.warn("Save draft failed", e));
    },
    []
  );

  // ─── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async (submissionId: number) => {
    const unanswered = questions.filter((q) => !(answers[q.id]?.length > 0));

    if (unanswered.length > 0) {
      Alert.alert(
        "Còn câu chưa trả lời",
        `Bạn còn ${unanswered.length} câu chưa chọn đáp án. Vẫn muốn nộp bài?`,
        [
          { text: "Kiểm tra lại", style: "cancel" },
          { text: "Nộp bài", style: "destructive", onPress: () => void doSubmit(submissionId) },
        ]
      );
      return;
    }
    await doSubmit(submissionId);
  };

  const doSubmit = async (submissionId: number) => {
    setPhase({ kind: "submitting" });
    try {
      const questionAnswers = Object.entries(answersRef.current).map(([qId, optIds]) => ({
        questionId: Number(qId),
        selectedOptionIds: optIds,
      }));

      await assignmentApi.submitAssignment(detail.id, { questionAnswers });

      // Try to get the submission detail for score (quiz auto-grade)
      let submissionDetail: ViewSubmission | null = null;
      try {
        submissionDetail = await assignmentApi.getCurrentSubmission(detail.id);
      } catch {
        // ignore if not available yet
      }

      const answeredCount = Object.values(answersRef.current).filter((ids) => ids.length > 0).length;
      setPhase({
        kind: "result",
        result: {
          submittedAt: new Date().toISOString(),
          answeredCount,
          totalCount: questions.length,
          score: submissionDetail?.grade?.score,
          maxScore: detail.maxScore,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể nộp bài.";
      setPhase({ kind: "taking", submissionId });
      Alert.alert("Nộp bài thất bại", msg);
    }
  };

  // ─── Navigation ──────────────────────────────────────────────────────────

  const goNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  // ─── Render: Loading ──────────────────────────────────────────────────────

  if (phase.kind === "starting" || phase.kind === "submitting") {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.centeredFlex}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>
            {phase.kind === "starting" ? "Đang khởi tạo bài kiểm tra..." : "Đang nộp bài..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render: Result ──────────────────────────────────────────────────────

  if (phase.kind === "result") {
    const { result } = phase;
    const hasScore = result.score !== undefined && result.score !== null;
    const pct = hasScore ? Math.round((result.score! / result.maxScore) * 100) : null;
    const tier = pct === null ? "neutral" : pct >= 80 ? "excellent" : pct >= 50 ? "pass" : "fail";
    const tierConfig = {
      excellent: { color: "#10b981", bg: "#dcfce7", icon: "trophy-outline" as const, label: "Xuất sắc" },
      pass: { color: "#f59e0b", bg: "#fef3c7", icon: "checkmark-circle-outline" as const, label: "Đạt yêu cầu" },
      fail: { color: "#ef4444", bg: "#fee2e2", icon: "alert-circle-outline" as const, label: "Chưa đạt" },
      neutral: { color: "#4f46e5", bg: "#eef2ff", icon: "checkmark-done-outline" as const, label: "Đã nộp" },
    }[tier];

    const formattedTime = (() => {
      const d = new Date(result.submittedAt);
      return isValid(d) ? format(d, "HH:mm - dd/MM/yyyy") : "Vừa xong";
    })();

    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{detail.title}</Text>
            <Text style={styles.headerSub}>Kết quả bài làm</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
          {/* Score ring */}
          <View style={[styles.resultCard, { borderColor: tierConfig.color, backgroundColor: tierConfig.bg }]}>
            <View style={[styles.resultTopBar, { backgroundColor: tierConfig.color }]} />

            {/* Badge */}
            <View style={styles.resultBadgeRow}>
              <View style={[styles.resultBadge, { backgroundColor: tierConfig.color + "22" }]}>
                <Ionicons name={tierConfig.icon} size={14} color={tierConfig.color} />
                <Text style={[styles.resultBadgeText, { color: tierConfig.color }]}>{tierConfig.label}</Text>
              </View>
            </View>

            {/* Score circle */}
            {hasScore ? (
              <View style={[styles.resultRing, { borderColor: tierConfig.color, backgroundColor: tierConfig.bg }]}>
                <Text style={[styles.resultRingScore, { color: tierConfig.color }]}>{result.score}</Text>
                <Text style={[styles.resultRingMax, { color: tierConfig.color }]}>/ {result.maxScore}</Text>
                <Text style={styles.resultRingPct}>{pct}%</Text>
              </View>
            ) : (
              <View style={[styles.resultRing, { borderColor: tierConfig.color, backgroundColor: tierConfig.bg }]}>
                <Ionicons name="checkmark-done" size={40} color={tierConfig.color} />
                <Text style={[styles.resultRingLabel, { color: tierConfig.color }]}>Đã nộp</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Chi tiết bài làm</Text>

            <View style={styles.statRow}>
              <View style={styles.statIcon}>
                <Ionicons name="time-outline" size={18} color="#4f46e5" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Thời điểm nộp</Text>
                <Text style={styles.statValue}>{formattedTime}</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statRow}>
              <View style={styles.statIcon}>
                <Ionicons name="help-circle-outline" size={18} color="#4f46e5" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Số câu đã trả lời</Text>
                <Text style={styles.statValue}>{result.answeredCount} / {result.totalCount} câu</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statRow}>
              <View style={styles.statIcon}>
                <Ionicons name="star-outline" size={18} color="#f59e0b" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Điểm tối đa</Text>
                <Text style={styles.statValue}>{result.maxScore} điểm</Text>
              </View>
            </View>

            {!hasScore && (
              <>
                <View style={styles.statDivider} />
                <View style={[styles.statRow, styles.statRowNote]}>
                  <Ionicons name="information-circle-outline" size={16} color="#64748b" />
                  <Text style={styles.statNote}>
                    Bài luận sẽ được giáo viên chấm điểm thủ công. Bạn sẽ nhận được kết quả sau.
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Actions */}
          <View style={styles.resultActions}>
            <TouchableOpacity
              style={styles.resultActionPrimary}
              onPress={onSubmitSuccess}
            >
              <Ionicons name="list-outline" size={18} color="#fff" />
              <Text style={styles.resultActionPrimaryText}>Về danh sách bài tập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase.kind === "error") {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.centeredFlex}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Có lỗi xảy ra</Text>
          <Text style={styles.errorDesc}>{phase.message}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void startQuiz()}>
            <Ionicons name="refresh-outline" size={16} color="#4f46e5" />
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { submissionId } = phase;
  const question = questions[currentIndex];
  const currentAnswers = (question && answers[question.id]) ?? [];
  const answeredCount = questions.filter((q) => (answers[q.id]?.length ?? 0) > 0).length;
  const isLastQuestion = currentIndex === questions.length - 1;

  const formatTimeRemaining = () => {
    if (timeRemaining === null) return "Không giới hạn";
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const isTimeCritical = timeRemaining !== null && timeRemaining <= 60;

  if (!question) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.centeredFlex}>
          <Ionicons name="warning-outline" size={40} color="#f59e0b" />
          <Text style={styles.errorTitle}>Không có câu hỏi nào</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onBack}>
            <Text style={styles.retryBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {detail.title}
          </Text>
          <Text style={styles.headerSub}>
            Đã trả lời: {answeredCount}/{questions.length} |{" "}
            <Text style={isTimeCritical ? styles.timerCritical : undefined}>
              ⏳ {formatTimeRemaining()}
            </Text>
          </Text>
        </View>
        <Pressable
          style={styles.submitHeaderBtn}
          onPress={() => void handleSubmit(submissionId)}
        >
          <Text style={styles.submitHeaderBtnText}>Nộp bài</Text>
        </Pressable>
      </View>

      {/* ── Progress bar ── */}
      <ProgressBar current={currentIndex + 1} total={questions.length} />

      {/* ── Question ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <QuestionCard
          question={question}
          index={currentIndex}
          total={questions.length}
          answers={currentAnswers}
          onAnswer={(ids) => void handleAnswer(question.id, ids, submissionId)}
        />
      </ScrollView>

      {/* ── Nav buttons ── */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
          onPress={goPrev}
          disabled={currentIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color={currentIndex === 0 ? "#cbd5e1" : "#4f46e5"} />
          <Text style={[styles.navBtnText, currentIndex === 0 && styles.navBtnTextDisabled]}>Trước</Text>
        </TouchableOpacity>

        {/* Dot indicators */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dotsRow}
        >
          {questions.map((q, i) => {
            const isAnswered = (answers[q.id]?.length ?? 0) > 0;
            return (
              <TouchableOpacity
                key={q.id}
                style={[
                  styles.dot,
                  i === currentIndex && styles.dotActive,
                  isAnswered && i !== currentIndex && styles.dotAnswered,
                ]}
                onPress={() => setCurrentIndex(i)}
              >
                <Text style={[styles.dotText, (i === currentIndex || isAnswered) && styles.dotTextActive]}>
                  {i + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isLastQuestion ? (
          <TouchableOpacity
            style={styles.navBtnSubmit}
            onPress={() => void handleSubmit(submissionId)}
          >
            <Ionicons name="checkmark-done" size={18} color="#fff" />
            <Text style={styles.navBtnSubmitText}>Nộp</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.navBtn} onPress={goNext}>
            <Text style={styles.navBtnText}>Tiếp</Text>
            <Ionicons name="chevron-forward" size={20} color="#4f46e5" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },

  // Result screen
  resultScroll: { padding: 16, paddingBottom: 40, gap: 16 },
  resultCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  resultTopBar: { height: 5 },
  resultBadgeRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  resultBadgeText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },
  resultRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 5,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  resultRingScore: { fontSize: 46, fontWeight: "900", lineHeight: 52 },
  resultRingMax: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  resultRingPct: { fontSize: 13, fontWeight: "600", color: "#475569", lineHeight: 18 },
  resultRingLabel: { fontSize: 12, fontWeight: "700", marginTop: 4 },

  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 20,
    gap: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  statRowNote: { alignItems: "flex-start", gap: 8 },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  statContent: { flex: 1 },
  statLabel: { fontSize: 12, color: "#64748b", fontWeight: "500", marginBottom: 2 },
  statValue: { fontSize: 15, color: "#0f172a", fontWeight: "700" },
  statDivider: { height: 1, backgroundColor: "#f1f5f9", marginLeft: 50 },
  statNote: { flex: 1, fontSize: 12, color: "#64748b", lineHeight: 18 },

  resultActions: { gap: 10 },
  resultActionPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: "#4f46e5",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  resultActionPrimaryText: { fontSize: 15, fontWeight: "800", color: "#fff" },

  centeredFlex: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },

  loadingText: { fontSize: 14, color: "#475569", marginTop: 8 },

  errorTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", textAlign: "center" },
  errorDesc: { fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 20 },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
  },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: "#4f46e5" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  headerSub: { fontSize: 11, color: "#64748b", marginTop: 1 },
  submitHeaderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
  },
  submitHeaderBtnText: { fontSize: 13, fontWeight: "800", color: "#ffffff" },

  // Progress
  progressBg: {
    height: 4,
    backgroundColor: "#e2e8f0",
  },
  progressFill: {
    height: 4,
    backgroundColor: "#4f46e5",
    borderRadius: 2,
  },

  // Scroll
  scrollContent: { padding: 16, paddingBottom: 24 },

  // Question card
  questionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  questionIndexBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
  },
  questionIndexText: { fontSize: 11, fontWeight: "800", color: "#4f46e5" },
  questionTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  questionTypeText: { fontSize: 10, fontWeight: "700", color: "#64748b" },
  questionPointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: "auto",
  },
  questionPointsText: { fontSize: 12, fontWeight: "700", color: "#f59e0b" },

  questionContent: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: 24,
    marginBottom: 18,
  },

  optionsList: { gap: 10 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  optionBtnSelected: {
    borderColor: "#4f46e5",
    backgroundColor: "#eef2ff",
  },
  optionText: { flex: 1, fontSize: 14, color: "#334155", lineHeight: 20 },
  optionTextSelected: { color: "#3730a3", fontWeight: "600" },

  // Radio
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  optionRadioSelected: { borderColor: "#4f46e5", backgroundColor: "#eef2ff" },
  optionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4f46e5",
  },

  // Checkbox
  optionCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  optionCheckboxSelected: {
    borderColor: "#4f46e5",
    backgroundColor: "#4f46e5",
  },

  // Nav bar
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    gap: 10,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    minWidth: 72,
    justifyContent: "center",
  },
  navBtnDisabled: { backgroundColor: "#f8fafc" },
  navBtnText: { fontSize: 13, fontWeight: "700", color: "#4f46e5" },
  navBtnTextDisabled: { color: "#cbd5e1" },

  navBtnSubmit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#10b981",
    minWidth: 72,
    justifyContent: "center",
  },
  navBtnSubmitText: { fontSize: 13, fontWeight: "800", color: "#fff" },

  dotsRow: {
    flexGrow: 1,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  dotActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  dotAnswered: {
    backgroundColor: "#dcfce7",
    borderColor: "#10b981",
  },
  dotText: { fontSize: 10, fontWeight: "700", color: "#64748b" },
  dotTextActive: { color: "#fff" },
  timerCritical: {
    color: "#ef4444",
    fontWeight: "800",
  },
});
