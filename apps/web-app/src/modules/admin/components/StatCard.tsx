"use client";

import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: ReactNode;
  variant?: "blue" | "emerald" | "violet" | "amber";
  statusText?: string;
}

export default function StatCard({
  title,
  value,
  trend,
  trendLabel = "vs last month",
  icon,
  variant = "blue",
  statusText,
}: StatCardProps) {
  const variantStyles = {
    blue: {
      iconBg: "bg-blue-50 text-blue-600 border-blue-100",
      border: "hover:border-blue-300",
    },
    emerald: {
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      border: "hover:border-emerald-300",
    },
    violet: {
      iconBg: "bg-violet-50 text-violet-600 border-violet-100",
      border: "hover:border-violet-300",
    },
    amber: {
      iconBg: "bg-amber-50 text-amber-600 border-amber-100",
      border: "hover:border-amber-300",
    },
  }[variant];

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md ${variantStyles.border}`}
    >
      <div className="flex items-center justify-between">
        {/* Metric Value & Label */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {title}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-800">
              {value}
            </span>
            {statusText && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                statusText === "Optimal" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                  : statusText === "Warning" 
                  ? "bg-amber-50 text-amber-700 border-amber-100" 
                  : "bg-red-50 text-red-700 border-red-100"
              }`}>
                {statusText}
              </span>
            )}
          </div>
        </div>

        {/* Icon Container */}
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${variantStyles.iconBg}`}>
          {icon}
        </div>
      </div>

      {/* Trend indicator */}
      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1.5 text-[11px]">
          <span
            className={`flex items-center gap-0.5 font-bold px-1 py-0.5 rounded ${
              trend >= 0 
                ? "bg-emerald-50 text-emerald-700" 
                : "bg-red-50 text-red-700"
            }`}
          >
            {trend >= 0 ? (
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
            {Math.abs(trend)}%
          </span>
          <span className="text-slate-400 font-medium">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
