"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  Award,
  AlertCircle,
  Loader2
} from "lucide-react";
import { assignmentApi } from "@/services/api/assignment.service";
import { useAuth } from "@/shared/providers/AuthProvider";

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

export default function CalendarPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Role-based logic: ROLE_TEACHER vs ROLE_STUDENT
  const isTeacher = user?.roles?.includes("ROLE_TEACHER") ?? false;

  // Current view state (starts at current local time in GMT+7)
  const currentLocalTime = dayjs().tz(LOCAL_TIMEZONE);
  const [currentDate, setCurrentDate] = useState<dayjs.Dayjs>(currentLocalTime);
  const [events, setEvents] = useState<ProcessedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state for detail panel
  const [selectedDate, setSelectedDate] = useState<string>(currentLocalTime.format("YYYY-MM-DD"));

  const year = currentDate.year();
  const month = currentDate.month() + 1; // dayjs month is 0-indexed

  // Fetch events on month/year changes
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);
        const rawEvents = await assignmentApi.getCalendarEvents(month, year);

        // Timezone Processing: Convert all UTC dueDates to Asia/Ho_Chi_Minh local time BEFORE feeding to UI
        const processed: ProcessedEvent[] = rawEvents.map((evt) => {
          const localDueDate = dayjs.utc(evt.dueDate).tz(LOCAL_TIMEZONE);
          return {
            ...evt,
            localDueDate,
            localDateStr: localDueDate.format("YYYY-MM-DD"),
          };
        });

        setEvents(processed);
      } catch (err: unknown) {
        console.error("Error loading calendar events:", err);
        setError("Không thể tải danh sách lịch nộp bài. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
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

  // Stats calculation
  const assignmentCount = events.filter((e) => e.type === "ASSIGNMENT").length;
  const quizCount = events.filter((e) => e.type === "QUIZ").length;
  const totalEvents = events.length;

  const selectedDateEvents = eventsByDate[selectedDate] || [];

  // Routing Handler based on Event Type
  const handleEventClick = (evt: ProcessedEvent) => {
    if (evt.teamId) {
      router.push(`/teams/${evt.teamId}?assignmentId=${evt.id}&type=${evt.type}`);
    } else {
      if (evt.type === "QUIZ") {
        router.push(`/online-quizzes/${evt.id}/quiz`);
      } else {
        router.push(`/assignments/${evt.id}/start`);
      }
    }
  };

  // English Month Display for Header (matching image 3 style)
  const englishMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const formattedMonthHeader = `${englishMonths[currentDate.month()]} ${year}`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="h-8 w-8 text-orange-500" />
            {isTeacher ? "Lịch dạy & Hạn chấm bài" : "Lịch học & Hạn nộp"}
          </h1>
        </div>

        {/* Stats summary widget */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
            <div className="p-1.5 bg-orange-100 rounded-lg">
              <CalendarIcon className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Tất cả</div>
              <div className="text-base font-bold text-slate-800 leading-none mt-0.5">{totalEvents}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
            <div className="p-1.5 bg-rose-100 rounded-lg">
              <BookOpen className="h-4 w-4 text-rose-600" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Bài tập</div>
              <div className="text-base font-bold text-slate-800 leading-none mt-0.5">{assignmentCount}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
            <div className="p-1.5 bg-violet-100 rounded-lg">
              <Award className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Trắc nghiệm</div>
              <div className="text-base font-bold text-slate-800 leading-none mt-0.5">{quizCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar Grid (Styled to match Image 3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col space-y-6">
          {/* Calendar Header matching Image 3 layout */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {formattedMonthHeader}
            </h2>

            {/* Navigation buttons: Left chevron, Today text link, Right chevron */}
            <div className="flex items-center gap-4 text-slate-600">
              <button
                onClick={handlePrevMonth}
                className="hover:text-slate-900 transition-colors cursor-pointer p-1"
                title="Tháng trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleToday}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm cursor-pointer transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="hover:text-slate-900 transition-colors cursor-pointer p-1"
                title="Tháng sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Month Grid Responsive Wrapper */}
          <div className="overflow-x-auto">
            <div className="min-w-[640px] flex flex-col space-y-4">
              {/* Days of Week Header (Sun, Mon, Tue, etc. matching Image 3) */}
              <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 py-1.5 border-b border-slate-100/50">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3 min-h-[420px]">
                  <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
                  <p className="text-sm font-medium">Đang tải lịch nộp bài...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-24 text-rose-500 gap-3 p-6 text-center min-h-[420px]">
                  <AlertCircle className="h-10 w-10" />
                  <p className="font-semibold text-sm">{error}</p>
                  <button
                    onClick={() => setCurrentDate(currentDate)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all mt-2 cursor-pointer"
                  >
                    Tải lại trang
                  </button>
                </div>
              ) : (
                /* Card-gap styled Calendar Grid */
                <div className="grid grid-cols-7 gap-3">
                  {calendarDays.map((day, idx) => {
                    const dayEvents = eventsByDate[day.dateStr] || [];
                    const isSelected = selectedDate === day.dateStr;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (day.isCurrentMonth) {
                            setSelectedDate(day.dateStr);
                          }
                        }}
                        className={`aspect-[1.3] border rounded-2xl p-2.5 flex flex-col justify-between transition-all cursor-pointer relative group ${day.isCurrentMonth
                          ? day.isToday
                            ? "bg-blue-50/30 border-blue-500 ring-1 ring-blue-500/20"
                            : isSelected
                              ? "bg-orange-50/10 border-orange-500/60 shadow-sm"
                              : "bg-white border-slate-200/60 hover:bg-slate-50/80"
                          : "bg-slate-50/50 border-slate-100 text-transparent pointer-events-none" // Completely empty cards for out-of-month padding
                          }`}
                      >
                        {/* Day numbers at top-left of cell */}
                        <div className="flex justify-between items-start">
                          {day.isCurrentMonth ? (
                            <span
                              className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${day.isToday
                                ? "bg-blue-500 text-white shadow-sm"
                                : isSelected
                                  ? "text-orange-600 bg-orange-100/30"
                                  : "text-slate-700"
                                }`}
                            >
                              {day.date.date()}
                            </span>
                          ) : (
                            <span className="w-6 h-6" />
                          )}
                        </div>

                        {/* Event list inside cells */}
                        <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar mt-1 pr-0.5">
                          {day.isCurrentMonth && dayEvents.slice(0, 2).map((evt) => {
                            const isQuiz = evt.type === "QUIZ";
                            return (
                              <div
                                key={evt.id}
                                onClick={(e) => {
                                  e.stopPropagation(); // Stop propagation to cell select
                                  handleEventClick(evt);
                                }}
                                title={`[${evt.courseName}] ${evt.title}`}
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-md border truncate block transition-all duration-150 transform hover:scale-[1.01] cursor-pointer select-none ${isQuiz
                                  ? "bg-purple-50 text-purple-700 border-purple-100/80 hover:bg-purple-100 hover:text-purple-800"
                                  : "bg-blue-50 text-blue-700 border-blue-100/80 hover:bg-blue-100 hover:text-blue-800"
                                  }`}
                              >
                                {evt.title}
                              </div>
                            );
                          })}
                          {day.isCurrentMonth && dayEvents.length > 2 && (
                            <div className="text-[9px] font-semibold text-slate-400 pl-1 py-0.5 text-center bg-slate-50/50 rounded">
                              + {dayEvents.length - 2} hạn nộp
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Detail Side Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-full max-h-[690px] overflow-hidden">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              {isTeacher ? "Chi tiết hạn chấm" : "Chi tiết hạn nộp"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {dayjs(selectedDate).format("dddd, [Ngày] D [tháng] M")}
            </p>
          </div>

          {/* List of deadlines on selected date */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar">
            {selectedDateEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center px-4">
                <CalendarIcon className="h-10 w-10 text-slate-300 stroke-[1.5] mb-2" />
                <p className="text-xs font-semibold">
                  {isTeacher
                    ? "Không có bài tập hay bài trắc nghiệm nào đến hạn chấm trong ngày này."
                    : "Không có bài tập hay bài trắc nghiệm nào đến hạn trong ngày này."}
                </p>
              </div>
            ) : (
              selectedDateEvents.map((evt) => {
                const isQuiz = evt.type === "QUIZ";
                return (
                  <div
                    key={evt.id}
                    onClick={() => handleEventClick(evt)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer transform hover:-translate-y-0.5 hover:shadow-md ${isQuiz
                      ? "bg-purple-50/40 hover:bg-purple-50/80 border-purple-100/60"
                      : "bg-blue-50/40 hover:bg-blue-50/80 border-blue-100/60"
                      }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider ${isQuiz
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                          }`}
                      >
                        {isQuiz ? "Trắc nghiệm" : "Tự luận"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {evt.localDueDate.format("HH:mm")}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm mt-2.5 line-clamp-2 hover:underline">
                      {evt.title}
                    </h4>

                    <div className="mt-3.5 pt-2 border-t border-slate-100/50 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-500 truncate max-w-[140px]" title={evt.courseName}>
                        {evt.courseName}
                      </span>
                      <span className="text-orange-500 hover:text-orange-600 font-extrabold flex items-center gap-0.5">
                        {isTeacher ? "Chấm bài" : "Làm bài"} &rarr;
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 bg-slate-50/30 p-2.5 rounded-xl text-[11px] text-slate-400 flex flex-col gap-1.5">
            <div className="font-bold text-slate-500">Chú thích:</div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span>
              <span>Bài tập tự luận (Assignment)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-purple-500 rounded-sm"></span>
              <span>Bài trắc nghiệm (Quiz)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollbar styling injected inline */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}