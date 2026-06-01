import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { isPast, isValid } from "date-fns";

import { assignmentApi } from "../assignment.api";
import type { Assignment } from "../assignment.types";
import AssignmentCard from "../components/AssignmentCard";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssignmentListScreenProps = {
  teamId: number;
  teamTitle: string;
  /** "ROLE_TEACHER" or "ROLE_STUDENT" */
  role: string;
  /** Called when student taps a card */
  onOpenAssignment?: (item: Assignment) => void;
  /** Teacher: called when FAB is pressed */
  onCreateAssignment?: () => void;
  /** Teacher: called when card is tapped → go to grading list */
  onOpenGrading?: (item: Assignment) => void;
};

type Tab = "upcoming" | "completed";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isUpcoming(item: Assignment): boolean {
  if (item.archived) return false;
  const d = new Date(item.dueDate);
  return isValid(d) && !isPast(d);
}

function isCompleted(item: Assignment): boolean {
  return item.archived || (isValid(new Date(item.dueDate)) && isPast(new Date(item.dueDate)));
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <Ionicons
          name={tab === "upcoming" ? "calendar-outline" : "checkmark-circle-outline"}
          size={32}
          color="#94a3b8"
        />
      </View>
      <Text style={styles.emptyTitle}>
        {tab === "upcoming" ? "Không có bài sắp đến hạn" : "Chưa có bài đã hoàn thành"}
      </Text>
      <Text style={styles.emptyDesc}>
        {tab === "upcoming"
          ? "Các bài tập chưa đến hạn sẽ hiển thị ở đây."
          : "Bài tập đã khóa hoặc quá hạn sẽ hiển thị ở đây."}
      </Text>
    </View>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AssignmentListScreen({
  teamId,
  teamTitle,
  role,
  onOpenAssignment,
  onCreateAssignment,
  onOpenGrading,
}: AssignmentListScreenProps) {
  const isTeacher = role === "ROLE_TEACHER";

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  // Animated indicator for segmented control
  const indicatorX = useRef(new Animated.Value(0)).current;
  const [segmentWidth, setSegmentWidth] = useState(0);

  // ─── Data fetching ─────────────────────────────────────────────────────────

  const fetchAssignments = useCallback(async (silent = false) => {
    try {
      // Clear existing assignments before fetching new ones
      if (!silent) {
        setAssignments([]);
        setLoading(true);
      }
      setError(null);
      
      if (!teamId) {
        setAssignments([]);
        setLoading(false);
        return;
      }
      
      const data = await assignmentApi.getAssignments(teamId);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách bài tập.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teamId]);

  useEffect(() => {
    void fetchAssignments();
  }, [fetchAssignments]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchAssignments(true);
  }, [fetchAssignments]);

  // ─── Segmented control animation ──────────────────────────────────────────

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    Animated.spring(indicatorX, {
      toValue: tab === "upcoming" ? 0 : segmentWidth,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  };

  // ─── Filtered data ────────────────────────────────────────────────────────

  const filteredList = useMemo(() => {
    return assignments.filter(
      activeTab === "upcoming" ? isUpcoming : isCompleted
    );
  }, [assignments, activeTab]);

  // ─── Card press ───────────────────────────────────────────────────────────

  const handleCardPress = (item: Assignment) => {
    if (isTeacher) {
      onOpenGrading?.(item);
    } else {
      onOpenAssignment?.(item);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bài Tập</Text>
          <Text style={styles.headerSub}>{teamTitle}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => void fetchAssignments()}
        >
          <Ionicons name="refresh-outline" size={18} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* ── Segmented Control ── */}
      <View
        style={styles.segmentTrack}
        onLayout={(e) => setSegmentWidth(e.nativeEvent.layout.width / 2)}
      >
        <Animated.View
          style={[
            styles.segmentIndicator,
            { width: segmentWidth, transform: [{ translateX: indicatorX }] },
          ]}
        />
        {(["upcoming", "completed"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.segmentBtn}
            onPress={() => switchTab(tab)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === tab && styles.segmentTextActive,
              ]}
            >
              {tab === "upcoming" ? "Sắp đến hạn" : "Đã hoàn thành"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Error banner ── */}
      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color="#b91c1c" />
          <Text style={styles.errorBannerText}>{error}</Text>
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
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <AssignmentCard item={item} index={index} onPress={handleCardPress} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState tab={activeTab} />}
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

      {/* ── FAB (Teacher only) ── */}
      {isTeacher && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={onCreateAssignment}
        >
          <Ionicons name="add" size={30} color="#ffffff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
  },
  headerSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748b",
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  // Segmented Control
  segmentTrack: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    padding: 4,
    position: "relative",
    overflow: "hidden",
  },
  segmentIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 11,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    zIndex: 1,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  segmentTextActive: {
    color: "#0f172a",
    fontWeight: "800",
  },
  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#b91c1c",
    lineHeight: 17,
  },
  errorRetry: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4f46e5",
  },
  // Loading
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#475569",
  },
  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 100,
  },
  // Empty state
  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  emptyDesc: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 19,
  },
  // FAB
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
