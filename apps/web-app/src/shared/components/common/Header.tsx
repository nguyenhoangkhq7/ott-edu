"use client";

import { useRouter } from "next/navigation";
import SearchInput from "@/shared/components/ui/SearchInput";
import IconButton from "@/shared/components/ui/IconButton";

interface HeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  userName: string;
  userRole: string;
  notifications: number;
}

export default function Header({
  searchValue,
  onSearchChange,
  userName,
  userRole,
  notifications,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleForward = () => {
    router.forward();
  };
  return (
    <header className="border-b border-slate-200 bg-white px-4 h-12 flex items-center">
      <div className="flex w-full items-center justify-between lg:grid lg:grid-cols-[1fr_minmax(0,620px)_1fr] lg:items-center">
        
        {/* BÊN TRÁI: Empty space for balance */}
        <div className="flex items-center">
        </div>

        {/* Ở GIỮA: Navigation arrows + Search */}
        <div className="flex items-center justify-center gap-2 w-full px-4">
          {/* Navigation arrows */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-7 h-7 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded transition-colors"
              title="Go back"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={handleForward}
              className="flex items-center justify-center w-7 h-7 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded transition-colors"
              title="Go forward"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
          
          {/* Search */}
          <div className="relative flex-1 max-w-[520px]">
            <SearchInput
              label="Search"
              placeholder="Search (Ctrl+E)"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </div>

        {/* BÊN PHẢI: More, Notifications và Account */}
        <div className="flex items-center justify-end gap-1">
          {/* Nút Ba chấm - Xóa bỏ khoảng cách và viền dư thừa */}
          <div className="flex items-center justify-center w-8 h-8 hover:bg-slate-100 rounded-md transition-colors cursor-pointer">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="currentColor">
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="6" cy="12" r="1.5" />
              <circle cx="18" cy="12" r="1.5" />
            </svg>
          </div>

          {/* Thông báo - Bỏ ring-white (viền tròn trắng bên ngoài) */}
          <div className="relative flex items-center justify-center w-8 h-8 hover:bg-slate-100 rounded-md transition-colors cursor-pointer">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 8a6 6 0 0112 0v5l2 2H4l2-2z" />
              <path d="M9.5 19a2.5 2.5 0 005 0" />
            </svg>
            {notifications > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#4b53bc] text-[9px] font-bold text-white">
                {notifications}
              </span>
            ) : null}
          </div>

          <div className="hidden xl:block ml-2 mr-2 text-right">
            <p className="text-[11px] font-medium text-slate-600 truncate max-w-[150px]">
              Industrial University...
            </p>
          </div>

          {/* Avatar - Bỏ viền border-slate-200 nếu muốn phẳng hoàn toàn */}
          <button className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#d1d2eb] text-[11px] font-bold text-[#4b53bc] hover:opacity-80 transition-opacity">
            {userName
              .split(" ")
              .map((part) => part[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white"></span>
          </button>
        </div>

      </div>
    </header>
  );
}