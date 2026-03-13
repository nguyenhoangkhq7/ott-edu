import type { ReactNode } from "react";
import type { NavItem } from "@/shared/types/navigation";
import Sidebar from "@/shared/components/common/Sidebar";
import Header from "@/shared/components/common/Header";

interface AppLayoutProps {
  sidebarItems: NavItem[];
  activeSidebarId?: string;
  header: {
    searchValue: string;
    onSearchChange: (value: string) => void;
    userName: string;
    userEmail: string;
    userRole: string;
    notifications: number;
    onNavigateBack?: () => void;
    onNavigateForward?: () => void;
    canGoBack?: boolean;
    canGoForward?: boolean;
  };
  children: ReactNode;
}

export default function AppLayout({
  sidebarItems,
  activeSidebarId,
  header,
  children,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white text-slate-900">
      <Sidebar items={sidebarItems} activeId={activeSidebarId} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header {...header} />
        <main className="flex-1 bg-slate-50 px-6 py-6">
          <div className="page-transition">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
