"use client";

import { useEffect, useState } from "react";
import MessageChart from "@/modules/admin/components/MessageChart";
import UserGrowthChart from "@/modules/admin/components/UserGrowthChart";
import TopActiveUsersTable from "@/modules/admin/components/TopActiveUsersTable";
import {
  getMessageStats,
  getUserGrowthStats,
  getTopActiveUsers,
} from "@/services/api/admin.service";
import type {
  MessageStatPoint,
  UserGrowthPoint,
  TopActiveUser,
} from "@/shared/types/admin";
import AppLoader from "@/shared/components/common/AppLoader";

export default function AdminStatisticsPage() {
  const [messageData, setMessageData] = useState<MessageStatPoint[]>([]);
  const [growthData, setGrowthData] = useState<UserGrowthPoint[]>([]);
  const [topUsers, setTopUsers] = useState<TopActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExportStats = () => {
    try {
      let csvContent = "Date,Internal Messages,External Messages\n";
      messageData.forEach(row => {
        csvContent += `${row.date},${row.internal},${row.external}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "message_statistics.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      showToast("CSV stats exported successfully.");
    } catch (error) {
      console.error("Export failed:", error);
      showToast("Failed to export statistics.", "error");
    }
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const [msgStats, growthStats, activeUsers] = await Promise.all([
          getMessageStats(),
          getUserGrowthStats(),
          getTopActiveUsers(),
        ]);
        setMessageData(msgStats);
        setGrowthData(growthStats);
        setTopUsers(activeUsers);
      } catch (error) {
        console.error("Failed to load statistics data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Analytics Console</h2>
          <p className="text-xs text-slate-500 mt-1">Platform-wide statistics, messaging volume, user growth, and active sessions.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selection */}
          <div className="relative">
            <select
              defaultValue="30days"
              className="h-9 px-3 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer pr-8"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>

          <button
            onClick={handleExportStats}
            className="flex items-center gap-2 h-9 px-3.5 rounded-md border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export Stats
          </button>
        </div>
      </div>

      {/* Grid containing Charts */}
      <div className="grid gap-6 md:grid-cols-[1.7fr_1fr]">
        <MessageChart data={messageData} />
        <UserGrowthChart data={growthData} />
      </div>

      {/* Top Active Users table */}
      <TopActiveUsersTable users={topUsers} />

      {/* Footer statistics summary status */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-5 text-[10px] text-slate-400 font-bold gap-3 uppercase tracking-wider">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Chat Service: Operational
          </span>
          <span className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Core Service: Operational
          </span>
        </div>
        <span>Last updated: just now</span>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-5 z-50 flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
