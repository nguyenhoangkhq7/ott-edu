import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { assignmentApi } from "../../../src/modules/assignments/assignment.api";
import { useAuth } from "../../../src/modules/auth/AuthProvider";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const LOCAL_TIMEZONE = "Asia/Ho_Chi_Minh";

interface ProcessedEvent {
  id: number;
  title: string;
  type: "ASSIGNMENT" | "QUIZ";
  courseName: string;
  teamId?: number;
  localDueDate: dayjs.Dayjs;
  localDateStr: string; // YYYY-MM-DD in local timezone
}

interface CalendarDay {
  date: dayjs.Dayjs;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateStr: string; // YYYY-MM-DD
}

export default function CalendarTab() {
  const router = useRouter();
  const { user } = useAuth();

  // Role check
  const isTeacher = user?.roles?.includes("ROLE_TEACHER") ?? false;

  // View state
  const currentLocalTime = dayjs().tz(LOCAL_TIMEZONE);
  const [currentDate, setCurrentDate] = useState<dayjs.Dayjs>(currentLocalTime);
  const [events, setEvents] = useState<ProcessedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected date
  const [selectedDate, setSelectedDate] = useState<string>(
    currentLocalTime.format("YYYY-MM-DD")
  );

  const year = currentDate.year();
  const month = currentDate.month() + 1; // dayjs month is 0-indexed

  // Fetch events on month/year changes
  useEffect(() => {
    let mounted = true;
    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);
        const rawEvents = await assignmentApi.getCalendarEvents(month, year);

        if (mounted) {
          // Process and convert UTC dueDates to Asia/Ho_Chi_Minh timezone
          const processed: ProcessedEvent[] = rawEvents.map((evt) => {
            const localDueDate = dayjs.utc(evt.dueDate).tz(LOCAL_TIMEZONE);
            return {
              ...evt,
              localDueDate,
              localDateStr: localDueDate.format("YYYY-MM-DD"),
            };
          });
          setEvents(processed);
        }
      } catch (err: unknown) {
        console.error("Error loading calendar events:", err);
        if (mounted) {
          setError("Không thể tải lịch nộp bài. Vui lòng thử lại sau.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchEvents();

    return () => {
      mounted = false;
    };
  }, [month, year]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(currentDate.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentDate(currentDate.add(1, "month"));
  };

  const handleToday = () => {
    const today = dayjs().tz(LOCAL_TIMEZONE);
    setCurrentDate(today);
    setSelectedDate(today.format("YYYY-MM-DD"));
  };

  // Generate calendar days grid
  const generateCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const startOfMonth = currentDate.startOf("month");
    const startDayOfWeek = startOfMonth.day(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = currentDate.daysInMonth();

    const todayStr = dayjs().tz(LOCAL_TIMEZONE).format("YYYY-MM-DD");

    // Padding days from previous month
    const prevMonth = currentDate.subtract(1, "month");
    const daysInPrevMonth = prevMonth.daysInMonth();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = prevMonth.date(daysInPrevMonth - i);
      const dateStr = prevDate.format("YYYY-MM-DD");
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        dateStr,
      });
    }

    // Days in current month
    for (let i = 1; i <= daysInMonth; i++) {
      const currDate = startOfMonth.date(i);
      const dateStr = currDate.format("YYYY-MM-DD");
      days.push({
        date: currDate,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        dateStr,
      });
    }

    // Padding days from next month
    const totalCells = days.length > 35 ? 42 : 35;
    const nextMonthPadding = totalCells - days.length;
    const nextMonth = currentDate.add(1, "month");
    for (let i = 1; i <= nextMonthPadding; i++) {
      const nextDate = nextMonth.date(i);
      const dateStr = nextDate.format("YYYY-MM-DD");
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        dateStr,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Group events by local date string
  const eventsByDate = events.reduce((acc, evt) => {
    if (!acc[evt.localDateStr]) {
      acc[evt.localDateStr] = [];
    }
    acc[evt.localDateStr].push(evt);
    return acc;
  }, {} as Record<string, ProcessedEvent[]>);

  const selectedDateEvents = eventsByDate[selectedDate] || [];

  // Routing Handler for deep links
  const handleEventClick = (evt: ProcessedEvent) => {
    if (evt.teamId) {
      router.push(`/teams?teamId=${evt.teamId}&assignmentId=${evt.id}&type=${evt.type}`);
    }
  };

  // Month Display Header (English)
  const englishMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const formattedMonthHeader = `${englishMonths[currentDate.month()]} ${year}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* 1. Header Panel */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="calendar" size={24} color="#f97316" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>
            {isTeacher ? "Lịch dạy & Hạn chấm bài" : "Lịch học & Hạn nộp"}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. Main Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Navigation Controls */}
          <View style={styles.calendarNav}>
            <Text style={styles.monthLabel}>{formattedMonthHeader}</Text>
            <View style={styles.navButtons}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleToday} style={styles.todayBtn}>
                <Text style={styles.todayText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekday Names Header */}
          <View style={styles.weekdaysContainer}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Text key={day} style={styles.weekdayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f97316" />
              <Text style={styles.loadingText}>Đang tải lịch...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={36} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {calendarDays.map((day, idx) => {
                const dayEvents = eventsByDate[day.dateStr] || [];
                const isSelected = selectedDate === day.dateStr;
                const hasAssignment = dayEvents.some((e) => e.type === "ASSIGNMENT");
                const hasQuiz = dayEvents.some((e) => e.type === "QUIZ");

                if (!day.isCurrentMonth) {
                  return (
                    <View key={`empty-${idx}`} style={styles.cell}>
                      <View style={[styles.cellInner, styles.cellOut]} />
                    </View>
                  );
                }

                return (
                  <View key={day.dateStr} style={styles.cell}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setSelectedDate(day.dateStr)}
                      style={[
                        styles.cellInner,
                        day.isToday && styles.cellToday,
                        isSelected && styles.cellSelected,
                      ]}
                    >
                      <View
                        style={[
                          styles.dateNumberWrap,
                          day.isToday && styles.dateNumberWrapToday,
                          isSelected && !day.isToday && styles.dateNumberWrapSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateText,
                            day.isToday && styles.dateTextToday,
                            isSelected && !day.isToday && styles.dateTextSelected,
                          ]}
                        >
                          {day.date.date()}
                        </Text>
                      </View>

                      {/* Dots Indicator */}
                      <View style={styles.dotsContainer}>
                        {hasAssignment && <View style={[styles.dot, styles.dotAssignment]} />}
                        {hasQuiz && <View style={[styles.dot, styles.dotQuiz]} />}
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 3. Detail Panel */}
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={styles.detailHeaderTitleRow}>
              <Ionicons name="time-outline" size={20} color="#f97316" />
              <Text style={styles.detailTitle}>
                {isTeacher ? "Chi tiết hạn chấm" : "Chi tiết hạn nộp"}
              </Text>
            </View>
            <Text style={styles.detailDateText}>
              {dayjs(selectedDate).format("dddd, [Ngày] D [tháng] M")}
            </Text>
          </View>

          {/* List of deadlines */}
          <View style={styles.eventsList}>
            {selectedDateEvents.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={36} color="#cbd5e1" />
                <Text style={styles.emptyText}>
                  {isTeacher
                    ? "Không có bài tập hay bài trắc nghiệm nào đến hạn chấm trong ngày này."
                    : "Không có bài tập hay bài trắc nghiệm nào đến hạn trong ngày này."}
                </Text>
              </View>
            ) : (
              selectedDateEvents.map((evt) => {
                const isQuiz = evt.type === "QUIZ";
                return (
                  <TouchableOpacity
                    key={evt.id}
                    activeOpacity={0.8}
                    onPress={() => handleEventClick(evt)}
                    style={[styles.eventCard, isQuiz ? styles.eventCardQuiz : styles.eventCardAssignment]}
                  >
                    <View style={styles.eventCardHeader}>
                      <View style={[styles.typePill, isQuiz ? styles.typePillQuiz : styles.typePillAssignment]}>
                        <Text style={[styles.typePillText, isQuiz ? styles.typePillTextQuiz : styles.typePillTextAssignment]}>
                          {isQuiz ? "Trắc nghiệm" : "Tự luận"}
                        </Text>
                      </View>
                      <View style={styles.dueTimeRow}>
                        <Ionicons name="time" size={12} color="#94a3b8" style={{ marginRight: 4 }} />
                        <Text style={styles.dueTimeText}>{evt.localDueDate.format("HH:mm")}</Text>
                      </View>
                    </View>

                    <Text style={styles.eventTitle} numberOfLines={2}>
                      {evt.title}
                    </Text>

                    <View style={styles.eventCardFooter}>
                      <Text style={styles.courseName} numberOfLines={1}>
                        {evt.courseName}
                      </Text>
                      <View style={styles.ctaRow}>
                        <Text style={styles.ctaText}>{isTeacher ? "Chấm bài" : "Làm bài"}</Text>
                        <Ionicons name="arrow-forward" size={12} color="#f97316" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Legend */}
          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Chú thích:</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendIndicator, { backgroundColor: "#3b82f6" }]} />
              <Text style={styles.legendText}>Bài tập tự luận (Assignment)</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendIndicator, { backgroundColor: "#a855f7" }]} />
              <Text style={styles.legendText}>Bài trắc nghiệm (Quiz)</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "#f8fafc",
  },
  calendarCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
  },
  calendarNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  navButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  navBtn: {
    padding: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
  },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    marginHorizontal: 8,
  },
  todayText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  weekdaysContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 8,
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  cell: {
    width: "14.28%",
    padding: 4,
    aspectRatio: 1,
  },
  cellInner: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  cellOut: {
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  cellToday: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
  },
  cellSelected: {
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
  },
  dateNumberWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dateNumberWrapToday: {
    backgroundColor: "#3b82f6",
  },
  dateNumberWrapSelected: {
    backgroundColor: "#ffedd5",
  },
  dateText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#334155",
  },
  dateTextToday: {
    color: "#ffffff",
  },
  dateTextSelected: {
    color: "#ea580c",
  },
  dotsContainer: {
    flexDirection: "row",
    marginTop: 2,
    height: 4,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotAssignment: {
    backgroundColor: "#ef4444",
  },
  dotQuiz: {
    backgroundColor: "#a855f7",
  },
  loadingContainer: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 12,
  },
  errorContainer: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  errorText: {
    marginTop: 8,
    color: "#ef4444",
    fontSize: 12,
    textAlign: "center",
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  detailHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 12,
    marginBottom: 12,
  },
  detailHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginLeft: 6,
  },
  detailDateText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  eventsList: {
    marginBottom: 12,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  eventCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  eventCardAssignment: {
    backgroundColor: "#f0f7ff",
    borderColor: "#dbeafe",
  },
  eventCardQuiz: {
    backgroundColor: "#faf5ff",
    borderColor: "#f3e8ff",
  },
  eventCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typePillAssignment: {
    backgroundColor: "#dbeafe",
  },
  typePillQuiz: {
    backgroundColor: "#f3e8ff",
  },
  typePillText: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  typePillTextAssignment: {
    color: "#2563eb",
  },
  typePillTextQuiz: {
    color: "#7c3aed",
  },
  dueTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dueTimeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },
  eventCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.5)",
    paddingTop: 8,
  },
  courseName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    flex: 1,
    marginRight: 8,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ctaText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#f97316",
    marginRight: 4,
  },
  legendContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#64748b",
    marginBottom: 6,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 2,
    marginRight: 8,
  },
  legendText: {
    fontSize: 11,
    color: "#64748b",
  },
});