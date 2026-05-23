"use client";

import type { ActivityItem } from "@/shared/types/admin";

interface RecentActivityTableProps {
  activities: ActivityItem[];
}

export default function RecentActivityTable({ activities }: RecentActivityTableProps) {
  // Helper to parse bold markdown **text**
  const renderFormattedEvent = (eventText: string) => {
    const parts = eventText.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "user-plus":
        return (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        );
      case "lock":
        return (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        );
      case "database":
        return (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
          </svg>
        );
      case "key":
        return (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zM12 5.79l2-2 3 3-2 2" />
          </svg>
        );
      case "edit":
        return (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  const getTargetBadgeColor = (type: string) => {
    switch (type) {
      case "SECURITY":
        return "bg-red-50 text-red-700 border-red-100";
      case "SYSTEM":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "DEVOPS":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "STAFF":
        return "bg-violet-50 text-violet-700 border-violet-100";
      case "CUSTOMER":
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col h-full shadow-sm">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Recent Activities</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Live audit log from core and chat services</p>
        </div>
        <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {activities.map((activity, idx) => (
          <div
            key={activity.id || idx}
            className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50/70 transition-colors border border-transparent hover:border-slate-100"
          >
            {/* Event Icon */}
            <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-400">
              {getIcon(activity.iconType)}
            </div>

            {/* Event Details */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-[11px] text-slate-600 leading-normal">
                {renderFormattedEvent(activity.event)}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-medium text-slate-400">{activity.timestamp}</span>
                <span
                  className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getTargetBadgeColor(
                    activity.targetType
                  )}`}
                >
                  {activity.targetType}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
