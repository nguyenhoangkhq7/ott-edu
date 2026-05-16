import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { format, isValid } from "date-fns";

import { assignmentApi } from "../assignment.api";
import { SubmissionStatus, type SubmissionGradingItem } from "../assignment.types";
import GradeSubmissionSheet from "../components/GradeSubmissionSheet";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GradingListScreenProps = {
  assignmentId: number;
  assignmentTitle: string;
  maxScore: number;
  onBack: () => void;
};

type FilterMode = "pending" | "all";

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatSubmittedAt(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  return isValid(d) ? format(d, "dd/MM HH:mm") : value;
}

// ─── Row component ────────────────────────────────────────────────────────────

function SubmissionRow({
  item,
  onGrade,
}: {
  item: SubmissionGradingItem;
  onGrade: (item: SubmissionGradingItem) => void;
}) {
  const isGraded = item.isGraded || item.status === SubmissionStatus.GRADED;
  const isLate = item.isLate;

  return (
    <View style={styles.row}>
      {/* Avatar placeholder */}
      <View style={[styles.avatar, isGraded && styles.avatarGraded]}>
        <Ionicons
          name={isGraded ? "checkmark" : "person-outline"}
          size={18}
          color={isGraded ? "#ffffff" : "#4f46e5"}
        />
      </View>

      {/* Info */}
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>Sinh viên #{item.studentAccountId}</Text>
        <View style={styles.rowMetaRow}>
          <Text style={styles.rowMeta}>
            Nộp lúc {formatSubmittedAt(item.submittedAt)}
          </Text>
          {isLate && (
            <View style={styles.lateBadge}>
              <Text style={styles.lateBadgeText}>Trễ hạn</Text>
            </View>
          )}
        </View>
        {isGraded && item.currentScore !== null && (
          <Text style={styles.rowScore}>
            Điểm: <Text style={styles.rowScoreValue}>{item.currentScore}</Text>
          </Text>
        )}
      </View>

      {/* Action button */}
      <TouchableOpacity
        style={[styles.gradeBtn, isGraded && styles.gradeBtnRegraded]}
        onPress={() => onGrade(item)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isGraded ? "create-outline" : "checkmark-circle-outline"}
          size={15}
          color={isGraded ? "#64748b" : "#ffffff"}
        />
        <Text style={[styles.gradeBtnText, isGraded && styles.gradeBtnTextRegraded]}>
          {isGraded ? "Sửa điểm" : "Chấm điểm"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GradingListScreen({
  assignmentId,
  assignmentTitle,
  maxScore,
  onBack,
}: GradingListScreenProps) {
  const [submissions, setSubmissions] = useState<SubmissionGradingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("pending");
  const [selectedItem, setSelectedItem] = useState<SubmissionGradingItem | null>(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchSubmissions = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        setError(null);
        const data =
          filterMode === "pending"
            ? await assignmentApi.getPendingSubmissions(assignmentId)
            : await assignmentApi.getAllSubmissions(assignmentId);
        setSubmissions(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Không thể tải danh sách bài nộp."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [assignmentId, filterMode]
  );

  useEffect(() => {
    void fetchSubmissions();
  }, [fetchSubmissions]);

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchSubmissions(true);
  };

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = submissions.length;
    const graded = submissions.filter((s) => s.isGraded).length;
    const pending = total - graded;
    return { total, graded, pending };
  }, [submissions]);

  // ─── Grading callback ─────────────────────────────────────────────────────

  const handleGradeSuccess = () => {
    setSelectedItem(null);
    void fetchSubmissions(true);
  };

  const handleDelete = () => {
    Alert.alert(
      "Xóa bài tập?",
      "Bài tập này sẽ bị lưu trữ và không thể chỉnh sửa. Bạn có chắc chắn muốn xóa?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await assignmentApi.archiveAssignment(assignmentId);
              Alert.alert("Thành công", "Đã xóa bài tập.");
              onBack(); // Return to list
            } catch (err) {
              Alert.alert("Lỗi", err instanceof Error ? err.message : "Không thể xóa bài tập.");
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Chấm bài
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {assignmentTitle}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => void fetchSubmissions()}
          >
            <Ionicons name="refresh-outline" size={18} color="#4f46e5" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: "Tổng", value: stats.total, color: "#0f172a" },
          { label: "Đã chấm", value: stats.graded, color: "#10b981" },
          { label: "Chưa chấm", value: stats.pending, color: "#f59e0b" },
        ].map(({ label, value, color }) => (
          <View key={label} style={styles.statCard}>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Filter toggle */}
      <View style={styles.filterRow}>
        {(["pending", "all"] as FilterMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.filterBtn,
              filterMode === mode && styles.filterBtnActive,
            ]}
            onPress={() => setFilterMode(mode)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterBtnText,
                filterMode === mode && styles.filterBtnTextActive,
              ]}
            >
              {mode === "pending" ? "Chờ chấm" : "Tất cả"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="warning-outline" size={15} color="#b91c1c" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={(item) => item.submissionId.toString()}
          renderItem={({ item }) => (
            <SubmissionRow item={item} onGrade={setSelectedItem} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="document-outline" size={36} color="#94a3b8" />
              <Text style={styles.emptyTitle}>
                {filterMode === "pending"
                  ? "Không có bài chờ chấm"
                  : "Chưa có bài nộp nào"}
              </Text>
            </View>
          }
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

      {/* Grade Sheet Modal */}
      {selectedItem && (
        <GradeSubmissionSheet
          visible={!!selectedItem}
          submission={selectedItem}
          maxScore={maxScore}
          onClose={() => setSelectedItem(null)}
          onSuccess={handleGradeSuccess}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    flexDirection: "row",
    alignItems: "center",
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
  headerCenter: { flex: 1, paddingHorizontal: 12 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  headerSub: { fontSize: 12, color: "#64748b", marginTop: 1 },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    margin: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: "900" },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 3, fontWeight: "600" },

  // Filter
  filterRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  filterBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
  },
  filterBtnActive: { backgroundColor: "#4f46e5" },
  filterBtnText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  filterBtnTextActive: { color: "#ffffff" },

  // Error
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { flex: 1, fontSize: 12, color: "#b91c1c" },

  // Loading
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#475569" },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarGraded: { backgroundColor: "#10b981" },
  rowBody: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  rowMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowMeta: { fontSize: 12, color: "#64748b" },
  lateBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lateBadgeText: { fontSize: 10, fontWeight: "700", color: "#b91c1c" },
  rowScore: { fontSize: 12, color: "#64748b" },
  rowScoreValue: { fontWeight: "800", color: "#10b981" },
  gradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
  },
  gradeBtnRegraded: { backgroundColor: "#f1f5f9" },
  gradeBtnText: { fontSize: 12, fontWeight: "700", color: "#ffffff" },
  gradeBtnTextRegraded: { color: "#64748b" },

  // Empty
  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#64748b" },
});
