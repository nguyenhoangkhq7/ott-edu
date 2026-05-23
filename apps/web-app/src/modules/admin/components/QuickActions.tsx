"use client";

import type { QuickActionItem } from "@/shared/types/admin";

interface QuickActionsProps {
  actions: QuickActionItem[];
  onActionClick?: (id: string) => void;
}

export default function QuickActions({ actions, onActionClick }: QuickActionsProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "user-plus":
        return (
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-[#005fb8]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        );
      case "clipboard":
        return (
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
        );
      case "shield":
        return (
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 17v-5h6v5" />
          </svg>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col h-full shadow-sm">
      <div className="pb-3.5 border-b border-slate-100 mb-3.5">
        <h3 className="text-sm font-bold text-slate-800">Quick Operations</h3>
        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Common administrative and security actions</p>
      </div>

      <div className="flex-1 space-y-2.5">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick?.(action.id)}
            className="w-full flex items-center gap-3.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-left transition-all hover:bg-slate-50 hover:border-slate-350 cursor-pointer"
          >
            {/* Icon circle */}
            <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200">
              {getIcon(action.iconType)}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-0.5">
              <h4 className="text-[11px] font-bold text-slate-700">{action.title}</h4>
              <p className="text-[10px] text-slate-400 leading-normal font-medium">{action.description}</p>
            </div>

            {/* Arrow */}
            <div className="text-slate-400">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
