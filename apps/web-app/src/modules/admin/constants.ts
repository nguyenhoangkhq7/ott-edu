// ============================================================
// Admin Dashboard Mock Data & Constants
// ============================================================

import type {
  AdminUser,
  DashboardStats,
  ActivityItem,
  QuickActionItem,
  MessageStatPoint,
  UserGrowthPoint,
  TopActiveUser,
  FilterOption,
} from '@/shared/types/admin';

// ---- Filter Options ----

export const ROLE_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'Super Admin', label: 'Super Admin' },
  { value: 'Editor', label: 'Editor' },
  { value: 'Viewer', label: 'Viewer' },
  { value: 'Teacher', label: 'Teacher' },
  { value: 'Student', label: 'Student' },
];

export const STATUS_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Locked', label: 'Locked' },
];

export const ROWS_PER_PAGE_OPTIONS: number[] = [5, 10, 20, 50];

// ---- Dashboard Stats ----

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalUsers: 12842,
  totalUsersTrend: 12,
  activeSessions: 1402,
  activeSessionsTrend: -2,
  totalMessages: '94.3k',
  totalMessagesTrend: 8,
  systemHealth: 99.9,
  systemHealthStatus: 'Optimal',
};

// ---- Recent Activity ----

export const MOCK_RECENT_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    iconType: 'user-plus',
    event: 'User **Sarah Connor** joined',
    highlightText: 'Sarah Connor',
    targetType: 'CUSTOMER',
    timestamp: '2 mins ago',
  },
  {
    id: 'act-2',
    iconType: 'lock',
    event: 'Account **Project-SkyNet** locked',
    highlightText: 'Project-SkyNet',
    targetType: 'SECURITY',
    timestamp: '14 mins ago',
  },
  {
    id: 'act-3',
    iconType: 'database',
    event: 'Database migration completed',
    highlightText: '',
    targetType: 'SYSTEM',
    timestamp: '1 hour ago',
  },
  {
    id: 'act-4',
    iconType: 'key',
    event: 'API Key **Dev-Alpha-4** rotated',
    highlightText: 'Dev-Alpha-4',
    targetType: 'DEVOPS',
    timestamp: '3 hours ago',
  },
  {
    id: 'act-5',
    iconType: 'edit',
    event: 'Profile updated by **Admin**',
    highlightText: 'Admin',
    targetType: 'STAFF',
    timestamp: '5 hours ago',
  },
];

// ---- Quick Actions ----

export const MOCK_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'qa-1',
    iconType: 'user-plus',
    title: 'Add Administrator',
    description: 'Provision new staff access',
  },
  {
    id: 'qa-2',
    iconType: 'clipboard',
    title: 'Audit Logs',
    description: 'Review security events',
  },
  {
    id: 'qa-3',
    iconType: 'shield',
    title: 'Block IP Range',
    description: 'Mitigate ongoing threats',
  },
];

// ---- User List ----

export const MOCK_USERS: AdminUser[] = [
  {
    accountId: 1,
    username: 'johndoe_admin',
    email: 'john.doe@company.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'Super Admin',
    status: 'Active',
    createdDate: 'Oct 12, 2023',
  },
  {
    accountId: 2,
    username: 'sarah_m',
    email: 's.miller@company.com',
    firstName: 'Sarah',
    lastName: 'Miller',
    role: 'Editor',
    status: 'Locked',
    createdDate: 'Nov 05, 2023',
  },
  {
    accountId: 3,
    username: 'robert_king',
    email: 'r.king@company.com',
    firstName: 'Robert',
    lastName: 'King',
    role: 'Viewer',
    status: 'Active',
    createdDate: 'Jan 18, 2024',
  },
  {
    accountId: 4,
    username: 'emily_lee',
    email: 'emily.lee@company.com',
    firstName: 'Emily',
    lastName: 'Lee',
    role: 'Editor',
    status: 'Active',
    createdDate: 'Feb 02, 2024',
  },
  {
    accountId: 5,
    username: 'michael_chen',
    email: 'm.chen@company.com',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'Teacher',
    status: 'Active',
    createdDate: 'Feb 15, 2024',
  },
  {
    accountId: 6,
    username: 'anna_nguyen',
    email: 'a.nguyen@company.com',
    firstName: 'Anna',
    lastName: 'Nguyen',
    role: 'Student',
    status: 'Active',
    createdDate: 'Mar 01, 2024',
  },
  {
    accountId: 7,
    username: 'david_park',
    email: 'd.park@company.com',
    firstName: 'David',
    lastName: 'Park',
    role: 'Viewer',
    status: 'Locked',
    createdDate: 'Mar 10, 2024',
  },
  {
    accountId: 8,
    username: 'lisa_tran',
    email: 'l.tran@company.com',
    firstName: 'Lisa',
    lastName: 'Tran',
    role: 'Student',
    status: 'Active',
    createdDate: 'Mar 22, 2024',
  },
  {
    accountId: 9,
    username: 'james_wilson',
    email: 'j.wilson@company.com',
    firstName: 'James',
    lastName: 'Wilson',
    role: 'Teacher',
    status: 'Active',
    createdDate: 'Apr 05, 2024',
  },
  {
    accountId: 10,
    username: 'sophia_garcia',
    email: 's.garcia@company.com',
    firstName: 'Sophia',
    lastName: 'Garcia',
    role: 'Editor',
    status: 'Active',
    createdDate: 'Apr 18, 2024',
  },
  {
    accountId: 11,
    username: 'alex_jones',
    email: 'a.jones@company.com',
    firstName: 'Alex',
    lastName: 'Jones',
    role: 'Student',
    status: 'Active',
    createdDate: 'May 01, 2024',
  },
  {
    accountId: 12,
    username: 'olivia_brown',
    email: 'o.brown@company.com',
    firstName: 'Olivia',
    lastName: 'Brown',
    role: 'Viewer',
    status: 'Locked',
    createdDate: 'May 12, 2024',
  },
  {
    accountId: 13,
    username: 'daniel_kim',
    email: 'd.kim@company.com',
    firstName: 'Daniel',
    lastName: 'Kim',
    role: 'Teacher',
    status: 'Active',
    createdDate: 'May 20, 2024',
  },
  {
    accountId: 14,
    username: 'emma_davis',
    email: 'e.davis@company.com',
    firstName: 'Emma',
    lastName: 'Davis',
    role: 'Student',
    status: 'Active',
    createdDate: 'Jun 03, 2024',
  },
  {
    accountId: 15,
    username: 'ryan_martinez',
    email: 'r.martinez@company.com',
    firstName: 'Ryan',
    lastName: 'Martinez',
    role: 'Editor',
    status: 'Active',
    createdDate: 'Jun 15, 2024',
  },
  {
    accountId: 16,
    username: 'chloe_white',
    email: 'c.white@company.com',
    firstName: 'Chloe',
    lastName: 'White',
    role: 'Student',
    status: 'Locked',
    createdDate: 'Jun 28, 2024',
  },
  {
    accountId: 17,
    username: 'kevin_pham',
    email: 'k.pham@company.com',
    firstName: 'Kevin',
    lastName: 'Pham',
    role: 'Viewer',
    status: 'Active',
    createdDate: 'Jul 10, 2024',
  },
  {
    accountId: 18,
    username: 'natalie_moore',
    email: 'n.moore@company.com',
    firstName: 'Natalie',
    lastName: 'Moore',
    role: 'Teacher',
    status: 'Active',
    createdDate: 'Jul 22, 2024',
  },
];

// ---- Message Statistics ----

export const MOCK_MESSAGE_STATS: MessageStatPoint[] = [
  { date: '01 Sep', internal: 120, external: 80 },
  { date: '04 Sep', internal: 150, external: 95 },
  { date: '08 Sep', internal: 180, external: 110 },
  { date: '11 Sep', internal: 160, external: 130 },
  { date: '15 Sep', internal: 220, external: 150 },
  { date: '18 Sep', internal: 200, external: 140 },
  { date: '22 Sep', internal: 280, external: 160 },
  { date: '25 Sep', internal: 260, external: 180 },
  { date: '29 Sep', internal: 310, external: 190 },
];

// ---- User Growth ----

export const MOCK_USER_GROWTH: UserGrowthPoint[] = [
  { month: 'May', count: 1800 },
  { month: 'Jun', count: 2100 },
  { month: 'Jul', count: 2400 },
  { month: 'Aug', count: 2840 },
];

// ---- Top Active Users ----

export const MOCK_TOP_ACTIVE_USERS: TopActiveUser[] = [
  {
    accountId: 101,
    name: 'Marcus Thorne',
    email: 'm.thorne@enterprise.com',
    lastActivity: '2 mins ago',
    messages: 1248,
    engagement: 85,
  },
  {
    accountId: 102,
    name: 'Elena Rodriguez',
    email: 'elena.r@globalops.net',
    lastActivity: '15 mins ago',
    messages: 982,
    engagement: 72,
  },
  {
    accountId: 103,
    name: 'Jordan Smith',
    email: 'j.smith@techstack.io',
    lastActivity: '42 mins ago',
    messages: 855,
    engagement: 68,
  },
];

// ---- Summary Stats ----

export const MOCK_USER_SUMMARY = {
  totalAccounts: 1248,
  activeNow: 842,
  pendingReview: 12,
};

export const MOCK_MONTHLY_PERFORMANCE = {
  capacityUtilization: 64,
};
