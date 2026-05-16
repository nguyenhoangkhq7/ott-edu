/**
 * AssignmentsTab — main entry point for the Assignments feature inside a Team.
 *
 * Renders the correct UI based on the authenticated user's role:
 *   • ROLE_TEACHER → sees FAB to create, taps card → GradingListScreen
 *   • ROLE_STUDENT → taps card → AssignmentDetailScreen (essay/quiz flow)
 *
 * Assignments are displayed in two separate sections:
 *   1. Bài tập (ESSAY) — teacher-graded essays
 *   2. Bài kiểm tra (QUIZ) — auto-graded quizzes
 *
 * Layout: sits below the TeamDetailScreen tab bar → NO SafeAreaView needed
 * (the parent TeamDetailScreen handles safe-area at the top).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../auth/AuthProvider";
import { assignmentApi } from "../../assignments/assignment.api";
import type { Assignment } from "../../assignments/assignment.types";
import { AssignmentType } from "../../assignments/assignment.types";
import AssignmentDetailScreen from "../../assignments/screens/AssignmentDetailScreen";
import AssignmentListScreen from "../../assignments/screens/AssignmentListScreen";
import CreateAssignmentScreen from "../../assignments/screens/CreateAssignmentScreen";
import GradingListScreen from "../../assignments/screens/GradingListScreen";
import TakeQuizScreen from "../../assignments/screens/TakeQuizScreen";
import QuizReviewScreen from "../../assignments/screens/QuizReviewScreen";
import type { AssignmentDetail } from "../../assignments/assignment.types";
import type { ViewSubmission } from "../../assignments/assignment.api";

// ─── Types ────────────────────────────────────────────────────────────────────

type AssignmentsTabProps = {
  teamId: number;
  teamTitle: string;
};

type Screen =
  | { name: "list" }
  | { name: "detail"; assignment: Assignment }
  | { name: "grading"; assignment: Assignment }
  | { name: "create" }
  | { name: "quiz"; detail: AssignmentDetail; submissionId?: number }
  | { name: "review"; detail: AssignmentDetail; submission: ViewSubmission };

// ─── Section data ─────────────────────────────────────────────────────────────

type AssignmentSection = {
  title: string;
  icon: string;
  color: string;
  bg: string;
  data: Assignment[];
  empty: string;
};

// ─── Assignment Card ──────────────────────────────────────────────────────────

function AssignmentCard({
  item,
  isTeacher,
  onPress,
}: {
  item: Assignment;
  isTeacher: boolean;
  onPress: (item: Assignment) => void;
}) {
  const isQuiz = item.type === AssignmentType.QUIZ;
  const due = item.dueDate ? new Date(item.dueDate) : null;
  const isPast = due ? due.getTime() < Date.now() : false;

  const dueDateColor = !due
    ? "#94a3b8"
    : isPast
    ? "#ef4444"
    : due.getTime() - Date.now() < 86_400_000 * 2
    ? "#f59e0b"
    : "#10b981";

  const formattedDue = due
    ? due.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Không có hạn";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      <View style={[styles.cardIcon, { backgroundColor: isQuiz ? "#eef2ff" : "#fef3c7" }]}>
        <Ionicons
          name={isQuiz ? "help-circle-outline" : "document-text-outline"}
          size={22}
          color={isQuiz ? "#4f46e5" : "#d97706"}
        />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {!!item.instructions && (
          <Text style={styles.cardDesc} numberOfLines={1}>
            {item.instructions}
          </Text>
        )}
        <View style={styles.cardMeta}>
          <View style={[styles.duePill, { backgroundColor: dueDateColor + "18" }]}>
            <Ionicons name="time-outline" size={11} color={dueDateColor} />
            <Text style={[styles.dueText, { color: dueDateColor }]}>{formattedDue}</Text>
          </View>
          <View style={styles.scorePill}>
            <Ionicons name="star-outline" size={11} color="#64748b" />
            <Text style={styles.scoreText}>Tối đa {item.maxScore} điểm</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardChevron}>
        <Ionicons
          name={isTeacher ? "people-outline" : "chevron-forward"}
          size={16}
          color="#94a3b8"
        />
      </View>
    </TouchableOpacity>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  icon,
  color,
  bg,
  count,
}: {
  title: string;
  icon: string;
  color: string;
  bg: string;
  count: number;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={15} color={color} />
      </View>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      <View style={[styles.sectionBadge, { backgroundColor: bg }]}>
        <Text style={[styles.sectionBadgeText, { color }]}>{count}</Text>
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AssignmentsTab({ teamId, teamTitle }: AssignmentsTabProps) {
  const { user } = useAuth();
  const isTeacher = (user?.roles ?? []).includes("ROLE_TEACHER");

  const [screen, setScreen] = useState<Screen>({ name: "list" });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const fetchAssignments = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await assignmentApi.getAssignments(teamId);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách bài tập.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teamId]);

  useEffect(() => { void fetchAssignments(); }, [fetchAssignments]);

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchAssignments(true);
  };

  // ─── Sections ───────────────────────────────────────────────────────────────

  const sections = useMemo<AssignmentSection[]>(() => {
    const essays = assignments.filter((a) => a.type === AssignmentType.ESSAY);
    const quizzes = assignments.filter((a) => a.type === AssignmentType.QUIZ);
    const result: AssignmentSection[] = [];

    if (essays.length > 0 || !quizzes.length) {
      result.push({
        title: "Bài tập (Essay)",
        icon: "document-text-outline",
        color: "#d97706",
        bg: "#fef3c7",
        data: essays,
        empty: "Chưa có bài tập essay nào.",
      });
    }
    if (quizzes.length > 0 || !essays.length) {
      result.push({
        title: "Bài kiểm tra (Quiz)",
        icon: "help-circle-outline",
        color: "#4f46e5",
        bg: "#eef2ff",
        data: quizzes,
        empty: "Chưa có bài kiểm tra nào.",
      });
    }

    return result;
  }, [assignments]);

  // ─── Navigation handlers ────────────────────────────────────────────────────

  const handleCardPress = (item: Assignment) => {
    if (isTeacher) {
      setScreen({ name: "grading", assignment: item });
    } else {
      setScreen({ name: "detail", assignment: item });
    }
  };

  const goBack = () => {
    setScreen({ name: "list" });
    void fetchAssignments(true); // refresh list after returning from detail
  };

  // ─── Screen routing ─────────────────────────────────────────────────────────

  if (screen.name === "detail") {
    return (
      <AssignmentDetailScreen
        assignmentId={screen.assignment.id}
        onBack={goBack}
        onStartQuiz={(detail, submissionId) => {
          setScreen({ name: "quiz", detail, submissionId });
        }}
        onReviewQuiz={(detail, submission) => {
          setScreen({ name: "review", detail, submission });
        }}
      />
    );
  }

  if (screen.name === "review") {
    return (
      <QuizReviewScreen
        detail={screen.detail}
        submission={screen.submission}
        onBack={() => setScreen({ name: "detail", assignment: screen.detail as unknown as Assignment })}
      />
    );
  }

  if (screen.name === "quiz") {
    return (
      <TakeQuizScreen
        detail={screen.detail}
        existingSubmissionId={screen.submissionId}
        onBack={() => setScreen({ name: "detail", assignment: screen.detail as unknown as Assignment })}
        onSubmitSuccess={() => {
          // Navigate back to detail — it will reload and show SUBMITTED/GRADED state
          setScreen({ name: "detail", assignment: screen.detail as unknown as Assignment });
        }}
      />
    );
  }

  if (screen.name === "grading") {
    return (
      <GradingListScreen
        assignmentId={screen.assignment.id}
        assignmentTitle={screen.assignment.title}
        maxScore={screen.assignment.maxScore}
        onBack={goBack}
      />
    );
  }

  if (screen.name === "create") {
    return (
      <CreateAssignmentScreen
        teamId={teamId}
        teamTitle={teamTitle}
        onBack={goBack}
        onSuccess={() => {
          setScreen({ name: "list" });
          void fetchAssignments(true);
        }}
      />
    );
  }

  // ─── List screen ────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {isTeacher ? "Quản lý bài tập" : "Bài tập & Kiểm tra"}
          </Text>
          <Text style={styles.headerSub}>{teamTitle}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => void fetchAssignments()}
        >
          <Ionicons name="refresh-outline" size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* ── Error banner ── */}
      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={14} color="#b91c1c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void fetchAssignments()}>
            <Text style={styles.errorRetry}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Đang tải bài tập...</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderSectionHeader={({ section }) => (
            <SectionHeader
              title={section.title}
              icon={section.icon}
              color={section.color}
              bg={section.bg}
              count={section.data.length}
            />
          )}
          renderItem={({ item }) => (
            <AssignmentCard
              item={item}
              isTeacher={isTeacher}
              onPress={handleCardPress}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="folder-open-outline" size={48} color="#c7d2fe" />
              <Text style={styles.emptyTitle}>Chưa có bài tập nào</Text>
              {isTeacher && (
                <Text style={styles.emptyDesc}>
                  Nhấn nút + để tạo bài tập mới cho lớp.
                </Text>
              )}
            </View>
          }
          renderSectionFooter={({ section }) =>
            section.data.length === 0 ? (
              <Text style={styles.sectionEmpty}>{section.empty}</Text>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#4f46e5"]}
              tintColor="#4f46e5"
            />
          }
        />
      )}

      {/* ── FAB: Teacher only — Create assignment ── */}
      {isTeacher && !loading && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => setScreen({ name: "create" })}
        >
          <Ionicons name="add" size={30} color="#ffffff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { flex: 1, fontSize: 12, color: "#b91c1c", lineHeight: 17 },
  errorRetry: { fontSize: 12, fontWeight: "800", color: "#4f46e5" },

  // Loading
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#475569" },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  sectionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBadgeText: { fontSize: 11, fontWeight: "800" },

  sectionEmpty: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontStyle: "italic",
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Assignment card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 5 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a", lineHeight: 20 },
  cardDesc: { fontSize: 12, color: "#64748b", lineHeight: 17 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  duePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dueText: { fontSize: 11, fontWeight: "600" },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  scoreText: { fontSize: 11, fontWeight: "600", color: "#64748b" },
  cardChevron: { paddingLeft: 8, flexShrink: 0 },

  // Empty state
  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#94a3b8" },
  emptyDesc: { fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 19 },

  // FAB — Teacher create button
  fab: {
    position: "absolute",
    bottom: 28,
    right: 24,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
});