// ============================================================
// Admin Dashboard Type Definitions
// ============================================================

/** User account status in admin context */
export type AdminUserStatus = 'Active' | 'Locked';

/** Admin user representation for management UI */
export interface AdminUser {
  accountId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: AdminUserStatus;
  createdDate: string;
  avatarUrl?: string;
  schoolId?: number;
  schoolName?: string;
  departmentId?: number;
  departmentName?: string;
}

export interface School {
  id: number;
  name: string;
}

export interface Department {
  id: number;
  name: string;
  schoolId: number;
}

/** Dashboard overview statistics */
export interface DashboardStats {
  totalUsers: number;
  totalUsersTrend: number;
  activeSessions: number;
  activeSessionsTrend: number;
  totalMessages: string;
  totalMessagesTrend: number;
  systemHealth: number;
  systemHealthStatus: 'Optimal' | 'Warning' | 'Critical';
}

/** Icon types used in activity feed */
export type ActivityIconType = 'user-plus' | 'lock' | 'database' | 'key' | 'edit';

/** Target type badges for activity feed */
export type ActivityTargetType = 'CUSTOMER' | 'SECURITY' | 'SYSTEM' | 'DEVOPS' | 'STAFF';

/** Single activity entry in the recent activity feed */
export interface ActivityItem {
  id: string;
  iconType: ActivityIconType;
  event: string;
  highlightText: string;
  targetType: ActivityTargetType;
  timestamp: string;
}

/** Quick action button configuration */
export interface QuickActionItem {
  id: string;
  iconType: 'user-plus' | 'clipboard' | 'shield';
  title: string;
  description: string;
}

/** Single data point for message statistics chart */
export interface MessageStatPoint {
  date: string;
  internal: number;
  external: number;
}

/** Single data point for user growth chart */
export interface UserGrowthPoint {
  month: string;
  count: number;
}

/** Top active user entry for statistics table */
export interface TopActiveUser {
  accountId: number;
  name: string;
  email: string;
  avatarUrl?: string;
  lastActivity: string;
  messages: number;
  engagement: number;
}

/** Generic paginated API response wrapper */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/** Filter/dropdown option type */
export interface FilterOption {
  value: string;
  label: string;
}
