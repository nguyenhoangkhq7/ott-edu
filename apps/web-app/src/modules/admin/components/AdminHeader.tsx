"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/shared/providers/AuthProvider";
import { getDisplayName, getInitialsFromDisplayName } from "@/shared/utils/user-display";
import Link from "next/link";

interface AdminHeaderProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
}

export default function AdminHeader({
  searchValue = "",
  onSearchChange,
  placeholder = "Search console...",
}: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = getDisplayName(user?.firstName, user?.lastName, user?.email);
  const initials = getInitialsFromDisplayName(displayName);

  const formatRole = (role?: string) => {
    if (!role) return "Administrator";
    const cleaned = role.replace(/^ROLE_/, "").replace(/_/g, " ").toLowerCase();
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  const userRole = formatRole(user?.roles?.[0]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Generate Breadcrumbs
  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((part, idx) => {
      const href = "/" + parts.slice(0, idx + 1).join("/");
      const label = part.charAt(0).toUpperCase() + part.slice(1);
      const isLast = idx === parts.length - 1;

      return { href, label, isLast };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex h-12 w-full items-center justify-between border-b border-slate-200 bg-white px-5 shrink-0">
      {/* Left Section: Navigation & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Navigation Arrows */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-3">
          <button
            onClick={() => router.back()}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Go back"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => router.forward()}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Go forward"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <Link href="/admin" className="hover:text-slate-600 transition-colors">
            Console
          </Link>
          {breadcrumbs.map((bc, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-3 w-3 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
              {bc.isLast ? (
                <span className="text-slate-700 font-semibold">{bc.label}</span>
              ) : (
                <Link href={bc.href} className="hover:text-slate-600 transition-colors">
                  {bc.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Middle Section: Search bar */}
      <div className="flex-1 max-w-sm mx-4">
        {onSearchChange && (
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-8 pl-8.5 pr-3 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
        )}
      </div>

      {/* Right Section: System stats, Notifications, Profile */}
      <div className="flex items-center gap-1">
        {/* Help Icon */}
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors">
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
          </svg>
        </button>

        {/* Notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors">
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#4b53bc] text-[9px] font-bold text-white">
            4
          </span>
        </button>

        {/* User Profile */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:opacity-95 transition-opacity"
          >
            <div className="relative h-8 w-8 rounded-full overflow-hidden bg-[#d1d2eb] text-[11px] font-bold text-[#4b53bc] flex items-center justify-center">
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  width={32}
                  height={32}
                />
              ) : (
                initials
              )}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-white"></span>
            </div>
            
            <div className="hidden md:flex flex-col text-left">
              <span className="text-[11px] font-bold text-slate-700 leading-none">{displayName}</span>
              <span className="text-[9px] text-slate-500 mt-0.5 leading-none">{userRole}</span>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-52 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[11px] font-bold text-slate-800">{displayName}</p>
                <p className="text-[9px] text-slate-500 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  {isLoggingOut ? "Signing Out..." : "Sign Out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
