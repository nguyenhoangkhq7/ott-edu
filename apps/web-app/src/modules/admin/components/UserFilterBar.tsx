"use client";

import type { FilterOption } from "@/shared/types/admin";

interface UserFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  role: string;
  onRoleChange: (value: string) => void;
  roleOptions: FilterOption[];
  status: string;
  onStatusChange: (value: string) => void;
  statusOptions: FilterOption[];
}

export default function UserFilterBar({
  search,
  onSearchChange,
  role,
  onRoleChange,
  roleOptions,
  status,
  onStatusChange,
  statusOptions,
}: UserFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search by name, email or username..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/10 transition-all"
        />
      </div>

      {/* Role Filter */}
      <div className="relative w-full md:w-44 flex flex-col gap-1 shrink-0">
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none"
        >
          {roleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>

      {/* Status Filter */}
      <div className="relative w-full md:w-40 flex flex-col gap-1 shrink-0">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>
    </div>
  );
}
