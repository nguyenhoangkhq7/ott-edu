"use client";

import Link from "next/link";
import type { NavItem } from "@/shared/types/navigation";

interface SidebarProps {
  items: NavItem[];
  activeId?: string;
}

export default function Sidebar({ items, activeId }: SidebarProps) {
  return (
    <aside className="flex h-full w-20 flex-shrink-0 flex-col items-center border-r border-slate-200 bg-white py-5 text-slate-700">
      {/* Logo Section */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center transition-transform hover:scale-105">
        <img
          src="../assets/logo.png"
          alt="Logo"
          className="h-14 w-14 object-contain"
        />
      </div>

      {/* Navigation Items */}
      <nav className="flex w-full flex-col items-center gap-1">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={true}
              className={`group relative flex w-full flex-col items-center justify-center py-3 px-2 transition-all duration-200 ease-out ${
                isActive 
                  ? "bg-blue-50 text-[#005fb8]" // Màu xanh Teams thay vì tím
                  : "text-slate-500 hover:bg-slate-50 hover:text-[#005fb8]"
              }`}
            >
              {/* THANH DỌC: Dài hơn (h-10) và có hiệu ứng trượt/ẩn hiện sinh động */}
              <div 
                className={`absolute left-0 w-[4px] rounded-r-full bg-[#005fb8] transition-all duration-200 ease-out ${
                  isActive 
                    ? "h-10 opacity-100 transform translate-x-0" 
                    : "h-0 opacity-0 transform -translate-x-full"
                }`} 
              />
              
              {/* Icon: Có hiệu ứng nảy nhẹ (scale) khi active hoặc hover */}
              <div className={`mb-1 transition-all duration-200 ${
                isActive ? "scale-110" : "group-hover:scale-110"
              }`}>
                {item.icon}
              </div>

              {/* Nhãn chữ: Chuyển màu mượt mà */}
              <span className={`text-[11px] font-medium leading-tight transition-colors duration-200 ${
                isActive ? "text-[#005fb8]" : "text-slate-500"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto flex w-full flex-col items-center gap-2">
        <button className="flex w-full flex-col items-center justify-center py-3 px-2 text-slate-500 hover:bg-blue-50 hover:text-[#005fb8] transition-all duration-200 rounded-lg">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
            <circle cx="12" cy="12" r="2" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="18" cy="12" r="2" />
          </svg>
        </button>

        <button className="flex w-full flex-col items-center justify-center py-3 px-2 text-slate-500 hover:bg-blue-50 hover:text-[#005fb8] transition-all duration-200 rounded-lg">
          <div className="flex h-7 w-7 items-center justify-center rounded border-2 border-current transition-transform group-hover:scale-110">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 7v10M7 12h10" />
            </svg>
          </div>
          <span className="mt-1 text-[11px]">Apps</span>
        </button>
      </div>
    </aside>
  );
}