// ============================================================
// Admin Service Layer
// Uses mock data for now — swap with real API calls later.
// Each function has a commented-out real API call for reference.
// ============================================================

import type {
  AdminUser,
  DashboardStats,
  ActivityItem,
  MessageStatPoint,
  UserGrowthPoint,
  TopActiveUser,
  PaginatedResponse,
} from '@/shared/types/admin';

import {
  MOCK_DASHBOARD_STATS,
  MOCK_RECENT_ACTIVITIES,
  MOCK_USERS,
  MOCK_MESSAGE_STATS,
  MOCK_USER_GROWTH,
  MOCK_TOP_ACTIVE_USERS,
  MOCK_USER_SUMMARY,
} from '@/modules/admin/constants';

// ---- Dashboard ----

export async function getDashboardStats(): Promise<DashboardStats> {
  // TODO: return httpService.get<DashboardStats>('/admin/dashboard/stats');
  return Promise.resolve(MOCK_DASHBOARD_STATS);
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  // TODO: return httpService.get<ActivityItem[]>('/admin/dashboard/activity');
  return Promise.resolve(MOCK_RECENT_ACTIVITIES);
}

// ---- User Management ----

export interface GetUsersParams {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
  status?: string;
}

export async function getUsers(
  params: GetUsersParams,
): Promise<PaginatedResponse<AdminUser>> {
  // TODO: return httpService.get<PaginatedResponse<AdminUser>>('/admin/users', { params });
  let filtered = [...MOCK_USERS];

  if (params.search) {
    const keyword = params.search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.username.toLowerCase().includes(keyword) ||
        u.email.toLowerCase().includes(keyword) ||
        u.firstName.toLowerCase().includes(keyword) ||
        u.lastName.toLowerCase().includes(keyword),
    );
  }

  if (params.role && params.role !== 'all') {
    filtered = filtered.filter((u) => u.role === params.role);
  }

  if (params.status && params.status !== 'all') {
    filtered = filtered.filter((u) => u.status === params.status);
  }

  const page = params.page ?? 0;
  const size = params.size ?? 10;
  const start = page * size;
  const content = filtered.slice(start, start + size);

  return Promise.resolve({
    content,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size),
    page,
    size,
  });
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export async function createUser(payload: CreateUserPayload): Promise<AdminUser> {
  // TODO: return httpService.post<AdminUser>('/admin/users', payload);
  return Promise.resolve({
    accountId: Date.now(),
    username: payload.email.split('@')[0],
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    role: payload.role,
    status: 'Active' as const,
    createdDate: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }),
  });
}

export async function deleteUser(userId: number): Promise<void> {
  // TODO: return httpService.delete<void>(`/admin/users/${userId}`);
  void userId;
  return Promise.resolve();
}

export async function lockUser(userId: number): Promise<void> {
  // TODO: return httpService.patch<void>(`/admin/users/${userId}/lock`);
  void userId;
  return Promise.resolve();
}

export async function unlockUser(userId: number): Promise<void> {
  // TODO: return httpService.patch<void>(`/admin/users/${userId}/unlock`);
  void userId;
  return Promise.resolve();
}

export async function resetUserPassword(userId: number): Promise<void> {
  // TODO: return httpService.post<void>(`/admin/users/${userId}/reset-password`);
  void userId;
  return Promise.resolve();
}

// ---- Statistics ----

export async function getMessageStats(): Promise<MessageStatPoint[]> {
  // TODO: return chatHttpService.get<MessageStatPoint[]>('/admin/stats/messages');
  return Promise.resolve(MOCK_MESSAGE_STATS);
}

export async function getUserGrowthStats(): Promise<UserGrowthPoint[]> {
  // TODO: return httpService.get<UserGrowthPoint[]>('/admin/stats/user-growth');
  return Promise.resolve(MOCK_USER_GROWTH);
}

export async function getTopActiveUsers(): Promise<TopActiveUser[]> {
  // TODO: return httpService.get<TopActiveUser[]>('/admin/stats/top-users');
  return Promise.resolve(MOCK_TOP_ACTIVE_USERS);
}

export async function getUserSummary(): Promise<{
  totalAccounts: number;
  activeNow: number;
  pendingReview: number;
}> {
  // TODO: return httpService.get('/admin/users/summary');
  return Promise.resolve(MOCK_USER_SUMMARY);
}
