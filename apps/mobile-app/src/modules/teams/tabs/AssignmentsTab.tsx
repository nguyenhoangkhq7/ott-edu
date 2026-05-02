import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

import { assignmentApi } from "../../assignments/assignment.api";
import type {
  AnswerOption,
  Assignment,
  AssignmentDetail,
  LocalAnswers,
  Question,
  QuestionType,
  SubmissionResult,
} from "../../assignments/assignment.types";

type AssignmentsTabProps = {
  teamId: number;
  teamTitle: string;
};

type ViewMode = "list" | "detail" | "quiz" | "result";

function formatDate(value?: string): string {
  if (!value) {
    return "Chưa có hạn";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return format(parsed, "dd/MM/yyyy HH:mm");
}

function isSelected(answers: LocalAnswers, questionId: number, optionId: number): boolean {
  return (answers[questionId] || []).includes(optionId);
}

function getOptionLabel(option: AnswerOption): string {
  return option.content?.trim() || `Option ${option.displayOrder}`;
}

export default function AssignmentsTab({ teamId, teamTitle }: AssignmentsTabProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignmentDetail, setAssignmentDetail] = useState<AssignmentDetail | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<LocalAnswers>({});
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [savingQuestionId, setSavingQuestionId] = useState<number | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await assignmentApi.getAssignments(teamId);
        if (mounted) {
          setAssignments(Array.isArray(data) ? data : []);
        }
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Không thể tải danh sách bài kiểm tra.");
          setAssignments([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAssignments();

    return () => {
      mounted = false;
    };
  }, [teamId, reloadTick]);

  const quizQuestions = useMemo(() => {
    return (assignmentDetail?.questions || []).slice().sort((left, right) => left.displayOrder - right.displayOrder);
  }, [assignmentDetail]);

  const openAssignment = async (assignment: Assignment) => {
    try {
      setLoadingDetail(true);
      setError(null);
      const detail = await assignmentApi.getAssignmentDetail(assignment.id);
      setSelectedAssignment(assignment);
      setAssignmentDetail(detail);
      setMode("detail");
      setAnswers({});
      setSubmissionId(null);
      setResult(null);
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "Không thể mở bài kiểm tra.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const startQuiz = async () => {
    if (!assignmentDetail || !selectedAssignment || selectedAssignment.archived) {
      return;
    }

    try {
      setLoadingStart(true);
      setError(null);
      const submission = await assignmentApi.startAssignment(assignmentDetail.id);
      setSubmissionId(submission.id);
      setMode("quiz");
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Không thể bắt đầu bài kiểm tra.");
    } finally {
      setLoadingStart(false);
    }
  };

  const updateAnswer = async (question: Question, optionId: number) => {
    if (!submissionId) {
      return;
    }

    const current = answers[question.id] || [];
    let nextSelected: number[] = [];

    if (question.type === "MULTI_CHOICE") {
      nextSelected = current.includes(optionId)
        ? current.filter((value) => value !== optionId)
        : [...current, optionId];
    } else {
      nextSelected = [optionId];
    }

    setAnswers((prev) => ({
      ...prev,
      [question.id]: nextSelected,
    }));

    try {
      setSavingQuestionId(question.id);
      await assignmentApi.saveAnswer(submissionId, question.id, nextSelected);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không thể lưu đáp án.");
    } finally {
      setSavingQuestionId((currentQuestionId) => (currentQuestionId === question.id ? null : currentQuestionId));
    }
  };

  const submitQuiz = async () => {
    if (!submissionId) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const submissionResult = await assignmentApi.submitAssignment(submissionId);
      setResult(submissionResult);
      setMode("result");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể nộp bài.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderList = () => {
    if (loading) {
      return (
        <View style={styles.stateBox}>
          <ActivityIndicator color="#4f46e5" size="large" />
          <Text style={styles.stateTitle}>Đang tải bài kiểm tra...</Text>
        </View>
      );
    }

    if (error && assignments.length === 0) {
      return (
        <View style={styles.stateBox}>
          <View style={styles.stateIcon}><Ionicons name="cloud-offline-outline" size={28} color="#ef4444" /></View>
          <Text style={styles.stateTitle}>Không tải được danh sách</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setReloadTick((value) => value + 1)}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (assignments.length === 0) {
      return (
        <View style={styles.stateBox}>
          <View style={styles.stateIcon}><Ionicons name="document-text-outline" size={28} color="#94a3b8" /></View>
          <Text style={styles.stateTitle}>Chưa có bài kiểm tra</Text>
          <Text style={styles.stateText}>Lớp {teamTitle} hiện chưa có online quiz nào.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={assignments}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const archived = item.archived;
          return (
            <TouchableOpacity
              style={[styles.assignmentCard, archived && styles.archivedCard]}
              activeOpacity={0.85}
              onPress={() => openAssignment(item)}
              disabled={loadingDetail}
            >
              <View style={[styles.cardBadge, { backgroundColor: archived ? "#e2e8f0" : ["#ede9fe", "#dcfce7", "#dbeafe", "#fee2e2"][index % 4] }]}>
                <Ionicons name={archived ? "lock-closed-outline" : "school-outline"} size={18} color={archived ? "#64748b" : "#4f46e5"} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, archived && styles.archivedText]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {archived && <Text style={styles.lockTag}>Đã khóa</Text>}
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.instructions || "Bài kiểm tra trực tuyến"}
                </Text>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardMeta}>{formatDate(item.dueDate)}</Text>
                  <Text style={styles.cardMeta}>Tối đa {item.maxScore} điểm</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    );
  };

  const renderDetail = () => {
    if (!selectedAssignment || !assignmentDetail) {
      return null;
    }

    return (
      <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        <View style={styles.detailHero}>
          <Text style={styles.detailLabel}>ONLINE QUIZ</Text>
          <Text style={styles.detailTitle}>{assignmentDetail.title}</Text>
          <Text style={styles.detailDesc}>{assignmentDetail.instructions || "Không có mô tả."}</Text>

          <View style={styles.detailStatsRow}>
            <View style={styles.detailStatCard}>
              <Text style={styles.detailStatValue}>{quizQuestions.length}</Text>
              <Text style={styles.detailStatLabel}>Câu hỏi</Text>
            </View>
            <View style={styles.detailStatCard}>
              <Text style={styles.detailStatValue}>{assignmentDetail.maxScore}</Text>
              <Text style={styles.detailStatLabel}>Tổng điểm</Text>
            </View>
            <View style={styles.detailStatCard}>
              <Text style={styles.detailStatValue}>{formatDate(assignmentDetail.dueDate).slice(0, 10)}</Text>
              <Text style={styles.detailStatLabel}>Hạn nộp</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoStrip}>
          <Ionicons name={selectedAssignment.archived ? "lock-closed-outline" : "time-outline"} size={18} color="#4f46e5" />
          <Text style={styles.infoStripText}>
            {selectedAssignment.archived
              ? "Bài kiểm tra này đã bị khóa."
              : "Mở bài kiểm tra để làm bài và lưu đáp án tự động."}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryAction} onPress={() => setMode("list")}>
            <Text style={styles.secondaryActionText}>Quay lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryAction, selectedAssignment.archived && styles.disabledAction]}
            onPress={startQuiz}
            disabled={selectedAssignment.archived || loadingStart}
          >
            {loadingStart ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryActionText}>Bắt đầu làm bài</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderQuiz = () => {
    if (!assignmentDetail) {
      return null;
    }

    return (
      <ScrollView contentContainerStyle={styles.quizContent} showsVerticalScrollIndicator={false}>
        <View style={styles.quizBanner}>
          <Text style={styles.quizBannerLabel}>Đang làm bài</Text>
          <Text style={styles.quizBannerTitle}>{assignmentDetail.title}</Text>
          <Text style={styles.quizBannerText}>Tự động lưu đáp án theo từng câu.</Text>
        </View>

        {quizQuestions.map((question, index) => (
          <View key={question.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionIndex}>Câu {index + 1}</Text>
              <Text style={styles.questionPoints}>{question.points} điểm</Text>
            </View>
            <Text style={styles.questionContent}>{question.content}</Text>

            <View style={styles.optionList}>
              {question.options
                .slice()
                .sort((left, right) => left.displayOrder - right.displayOrder)
                .map((option) => {
                  const selected = isSelected(answers, question.id, option.id);
                  const isMulti = question.type === "MULTI_CHOICE";
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.optionItem, selected && styles.optionItemSelected]}
                      onPress={() => updateAnswer(question, option.id)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.optionMarker, selected && styles.optionMarkerSelected]}>
                        <Text style={[styles.optionMarkerText, selected && styles.optionMarkerTextSelected]}>
                          {isMulti ? (selected ? "✓" : "") : selected ? "●" : ""}
                        </Text>
                      </View>
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{getOptionLabel(option)}</Text>
                    </TouchableOpacity>
                  );
                })}
            </View>

            {savingQuestionId === question.id && (
              <View style={styles.savingRow}>
                <ActivityIndicator size="small" color="#4f46e5" />
                <Text style={styles.savingText}>Đang lưu...</Text>
              </View>
            )}
          </View>
        ))}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryAction} onPress={() => setMode("detail")}>
            <Text style={styles.secondaryActionText}>Xem thông tin</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryAction} onPress={submitQuiz} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryActionText}>Nộp bài</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderResult = () => {
    if (!result) {
      return null;
    }

    return (
      <View style={styles.resultWrap}>
        <View style={styles.resultCard}>
          <View style={styles.resultIcon}><Ionicons name="checkmark-circle" size={38} color="#16a34a" /></View>
          <Text style={styles.resultTitle}>Nộp bài thành công</Text>
          <Text style={styles.resultScore}>
            {result.score}/{result.maxScore} điểm
          </Text>
          <Text style={styles.resultMeta}>
            Đã trả lời {result.answeredQuestions}/{result.totalQuestions} câu
            {typeof result.correctQuestions === "number" ? ` · Đúng ${result.correctQuestions} câu` : ""}
          </Text>
          <Text style={styles.resultFeedback}>{result.feedback || "Bài của bạn đã được gửi thành công."}</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => {
            setMode("list");
            setSelectedAssignment(null);
            setAssignmentDetail(null);
            setAnswers({});
            setSubmissionId(null);
            setResult(null);
          }}
        >
          <Text style={styles.primaryActionText}>Quay về danh sách</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Online Quizzes</Text>
            <Text style={styles.headerSubtitle}>{teamTitle}</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => setMode("list")}>
            <Ionicons name="refresh-outline" size={18} color="#4f46e5" />
          </TouchableOpacity>
        </View>

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        <View style={styles.body}>{mode === "list" ? renderList() : mode === "detail" ? renderDetail() : mode === "quiz" ? renderQuiz() : renderResult()}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  headerSubtitle: { marginTop: 2, fontSize: 12, color: "#64748b" },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBox: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { color: "#b91c1c", fontSize: 13, lineHeight: 18 },
  body: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 24 },
  assignmentCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  archivedCard: { opacity: 0.8 },
  cardBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "800", color: "#0f172a" },
  archivedText: { color: "#64748b" },
  lockTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
  },
  cardDesc: { marginTop: 6, fontSize: 13, lineHeight: 18, color: "#475569" },
  cardMetaRow: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", gap: 10 },
  cardMeta: { fontSize: 11, color: "#64748b" },
  stateBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  stateIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  stateTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", textAlign: "center" },
  stateText: { marginTop: 8, fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 18 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#4f46e5",
  },
  retryBtnText: { color: "#ffffff", fontWeight: "700" },
  detailContent: { padding: 16, paddingBottom: 28 },
  detailHero: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 18,
  },
  detailLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 1.2, color: "#4f46e5" },
  detailTitle: { marginTop: 8, fontSize: 22, fontWeight: "900", color: "#0f172a" },
  detailDesc: { marginTop: 10, fontSize: 14, lineHeight: 20, color: "#475569" },
  detailStatsRow: { marginTop: 16, flexDirection: "row", gap: 10 },
  detailStatCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  detailStatValue: { fontSize: 16, fontWeight: "900", color: "#0f172a" },
  detailStatLabel: { marginTop: 4, fontSize: 11, color: "#64748b" },
  infoStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#eef2ff",
  },
  infoStripText: { flex: 1, fontSize: 13, lineHeight: 18, color: "#334155" },
  actionRow: { marginTop: 14, flexDirection: "row", gap: 10 },
  secondaryAction: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
  },
  secondaryActionText: { color: "#334155", fontWeight: "800" },
  primaryAction: {
    flex: 1.2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledAction: { backgroundColor: "#94a3b8" },
  primaryActionText: { color: "#ffffff", fontWeight: "800" },
  quizContent: { padding: 16, paddingBottom: 28 },
  quizBanner: {
    backgroundColor: "#0f172a",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  quizBannerLabel: { color: "#94a3b8", fontSize: 12, fontWeight: "800" },
  quizBannerTitle: { marginTop: 6, color: "#ffffff", fontSize: 20, fontWeight: "900" },
  quizBannerText: { marginTop: 8, color: "#cbd5e1", fontSize: 13, lineHeight: 18 },
  questionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 14,
  },
  questionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  questionIndex: { color: "#4f46e5", fontSize: 12, fontWeight: "800" },
  questionPoints: { color: "#64748b", fontSize: 12, fontWeight: "700" },
  questionContent: { fontSize: 15, lineHeight: 22, fontWeight: "700", color: "#0f172a" },
  optionList: { marginTop: 12, gap: 10 },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  optionItemSelected: {
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
  },
  optionMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  optionMarkerSelected: {
    borderColor: "#4f46e5",
    backgroundColor: "#4f46e5",
  },
  optionMarkerText: { color: "transparent", fontWeight: "900", fontSize: 11 },
  optionMarkerTextSelected: { color: "#ffffff" },
  optionText: { flex: 1, fontSize: 14, lineHeight: 20, color: "#334155" },
  optionTextSelected: { color: "#1e1b4b", fontWeight: "700" },
  savingRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  savingText: { fontSize: 12, color: "#64748b" },
  resultWrap: { flex: 1, padding: 16, justifyContent: "center" },
  resultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 20,
    alignItems: "center",
  },
  resultIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  resultTitle: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  resultScore: { marginTop: 8, fontSize: 28, fontWeight: "900", color: "#16a34a" },
  resultMeta: { marginTop: 8, fontSize: 13, color: "#475569", textAlign: "center" },
  resultFeedback: { marginTop: 12, fontSize: 13, color: "#334155", textAlign: "center", lineHeight: 20 },
});