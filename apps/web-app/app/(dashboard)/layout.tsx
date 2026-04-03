"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppLayout from "@/shared/components/common/AppLayout";
import type { NavItem } from "@/shared/types/navigation";
import { useAuth } from "@/shared/providers/AuthProvider";
import { getDisplayName } from "@/shared/utils/user-display";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchValue, setSearchValue] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();

  const formatRole = (role?: string) => {
    if (!role) {
      return "User";
    }

    const cleanedRole = role.replace(/^ROLE_/, "").replace(/_/g, " ").toLowerCase();
    return cleanedRole.charAt(0).toUpperCase() + cleanedRole.slice(1);
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace("/login");
      setIsLoggingOut(false);
    }
  };

  const displayName = getDisplayName(user?.firstName, user?.lastName, user?.email);
  const userRole = formatRole(user?.roles?.[0]);

  // Get active page from pathname
  const getActivePageId = () => {
    if (pathname.includes('/teams')) return 'teams';
    if (pathname.includes('/activity')) return 'activity';
    if (pathname.includes('/chat')) return 'chat';
    if (pathname.includes('/assignments')) return 'assignments';
    if (pathname.includes('/calendar')) return 'calendar';
    return 'teams'; // default
  };

  const sidebarItems: NavItem[] = [
    {
      id: "activity",
      label: "Activity",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 12h4l2-6 4 12 2-6h4" />
        </svg>
      ),
      href: "/activity",
    },
    {
      id: "chat",
      label: "Chat",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      href: "/chat",
    },
    {
      id: "teams",
      label: "Teams",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="m22 21-3-3m0 0a5.5 5.5 0 1 0-7.8-7.8 5.5 5.5 0 0 0 7.8 7.8Z" />
        </svg>
      ),
      href: "/teams",
    },
    {
      id: "assignments",
      label: "Assignments",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 4h10v16H7z" />
          <path d="M9 8h6M9 12h6" />
        </svg>
      ),
      href: "/assignments",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      ),
      href: "/calendar",
    },
  ];

  const headerConfig = {
    searchValue,
    onSearchChange: setSearchValue,
    userName: displayName,
    userEmail: user?.email ?? "",
    userRole,
    userAvatarUrl: user?.avatarUrl ?? undefined,
    notifications: 3,
    onLogout: handleLogout,
    isLoggingOut,
  };

  return (
    <AppLayout
      sidebarItems={sidebarItems}
      activeSidebarId={getActivePageId()}
      header={headerConfig}
    >
      {children}
    </AppLayout>
  );
}
