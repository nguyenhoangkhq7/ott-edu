import { useState, useRef, useEffect } from "react";
import type { TeamItem } from "@/shared/types/teams";

interface TeamCardProps {
  item: TeamItem;
  showMenu?: boolean;
  onAddMember?: () => void;
  onLockToggle?: () => void;
}

export default function TeamCard({
  item,
  showMenu = false,
  onAddMember,
  onLockToggle,
}: TeamCardProps) {
  const isLocked = item.isActive === false;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <article
      className={`group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition ${
        !isLocked || showMenu ? "hover:-translate-y-0.5 hover:shadow-lg" : ""
      }`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-semibold text-white ${
            isLocked ? "filter grayscale opacity-80" : ""
          }`}
          style={{ backgroundColor: isLocked ? "#94a3b8" : item.accentColor }}
        >
          {isLocked ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : (
            item.initials
          )}
        </div>
        {showMenu && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              aria-label={`Open ${item.name} options`}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                {!isLocked && onAddMember && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDropdownOpen(false);
                      onAddMember();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="16" y1="11" x2="22" y2="11" />
                    </svg>
                    Thêm thành viên
                  </button>
                )}
                {onLockToggle && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDropdownOpen(false);
                      onLockToggle();
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      isLocked
                        ? "text-emerald-700 hover:bg-emerald-50/50"
                        : "text-rose-700 hover:bg-rose-50/50"
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                        </svg>
                        Mở khóa lớp
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Khóa lớp
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <h3 className={`text-sm font-semibold ${isLocked ? "text-slate-500" : "text-slate-900"}`}>{item.name}</h3>
      {item.subtitle ? <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.subtitle}</p> : null}
      {item.meta ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <span className={`inline-flex h-2 w-2 rounded-full ${isLocked ? "bg-slate-300" : "bg-emerald-400"}`} />
          <span>{item.meta}</span>
        </div>
      ) : null}
    </article>
  );
}
