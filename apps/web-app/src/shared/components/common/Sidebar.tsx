"use client";

import Link from "next/link";
import Image from "next/image";
import type { NavItem } from "@/shared/types/navigation";

interface SidebarProps {
  items: NavItem[];
  activeId?: string;
}

export default function Sidebar({ items, activeId }: SidebarProps) {
  return (
    <aside 
      className="flex h-full w-20 flex-shrink-0 flex-col items-center py-5 text-slate-700 relative"
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(30px) saturate(160%)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -10px 20px rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.25)',
        backgroundImage: 'linear-gradient(120deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.02) 100%)'
      }}
    >
      {/* Logo Section */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center transition-transform hover:scale-105">
        <Image
          src="/assets/logo.png"
          alt="Logo"
          className="h-14 w-14 object-contain"
          width={56}
          height={56}
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
              className="group relative flex w-full flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-300 ease-out"
              style={{
                background: isActive 
                  ? 'rgba(0, 95, 184, 0.15)' 
                  : 'transparent',
                backdropFilter: isActive 
                  ? 'blur(10px) saturate(140%)' 
                  : 'none',
                color: isActive ? '#005fb8' : 'rgb(100, 116, 139)'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(255,255,255,0.2), inset 0 0 10px rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#005fb8';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.color = 'rgb(100, 116, 139)';
                }
              }}
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
              <div className={`mb-1 transition-all duration-300 ${
                isActive ? "scale-110" : "group-hover:scale-110"
              }`}>
                {item.icon}
              </div>

              {/* Nhãn chữ: Chuyển màu mượt mà */}
              <span className="text-[11px] font-medium leading-tight transition-colors duration-300">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto flex w-full flex-col items-center gap-2">
        <button 
          className="flex w-full flex-col items-center justify-center py-3 px-2 text-slate-500 rounded-xl transition-all duration-300"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(255,255,255,0.2), inset 0 0 10px rgba(255,255,255,0.1)';
            e.currentTarget.style.color = '#005fb8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.color = 'rgb(100, 116, 139)';
          }}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
            <circle cx="12" cy="12" r="2" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="18" cy="12" r="2" />
          </svg>
        </button>

        <button 
          className="flex w-full flex-col items-center justify-center py-3 px-2 text-slate-500 rounded-xl transition-all duration-300"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(255,255,255,0.2), inset 0 0 10px rgba(255,255,255,0.1)';
            e.currentTarget.style.color = '#005fb8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.color = 'rgb(100, 116, 139)';
          }}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded border-2 border-current transition-transform hover:scale-110">
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