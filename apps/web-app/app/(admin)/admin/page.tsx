"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatCard from "@/modules/admin/components/StatCard";
import RecentActivityTable from "@/modules/admin/components/RecentActivityTable";
import QuickActions from "@/modules/admin/components/QuickActions";
import { getDashboardStats, getRecentActivity } from "@/services/api/admin.service";
import type { DashboardStats, ActivityItem } from "@/shared/types/admin";
import { MOCK_QUICK_ACTIONS } from "@/modules/admin/constants";
import AppLoader from "@/shared/components/common/AppLoader";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, activitiesData] = await Promise.all([
          getDashboardStats(),
          getRecentActivity(),
        ]);
        setStats(statsData);
        setActivities(activitiesData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleActionClick = (actionId: string) => {
    if (actionId === "qa-1") {
      router.push("/admin/users?add=true");
    } else {
      alert(`Action "${actionId}" triggered. This operations panel integrates with your logs/firewall controllers.`);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">System Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">Real-time health, operations feed, and system metrics overview.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert("Report compiled. Click to save PDF/CSV (incorporates audit & messaging datasets).")}
            className="flex items-center gap-2 h-9 px-3.5 rounded-md border border-slate-350 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export Report
          </button>
          
          <button
            onClick={() => router.push("/admin/users?add=true")}
            className="flex items-center gap-2 h-9 px-4 rounded-md bg-[#005fb8] hover:bg-blue-700 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.8">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Provision User
          </button>
        </div>
      </div>

      {/* 4x Stat Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <StatCard
          title="Total Accounts"
          value={stats.totalUsers.toLocaleString()}
          trend={stats.totalUsersTrend}
          variant="blue"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          }
        />

        {/* Active Sessions */}
        <StatCard
          title="Active Sessions"
          value={stats.activeSessions.toLocaleString()}
          trend={stats.activeSessionsTrend}
          trendLabel="vs last hour"
          variant="violet"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          }
        />

        {/* Total Messages */}
        <StatCard
          title="Total Messages"
          value={stats.totalMessages}
          trend={stats.totalMessagesTrend}
          variant="emerald"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
        />

        {/* System Health */}
        <StatCard
          title="System Health"
          value={`${stats.systemHealth}%`}
          statusText={stats.systemHealthStatus}
          variant="amber"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
        />
      </div>

      {/* Main Activity and Operations Side-By-Side Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <RecentActivityTable activities={activities} />
        <QuickActions actions={MOCK_QUICK_ACTIONS} onActionClick={handleActionClick} />
      </div>
    </div>
  );
}
