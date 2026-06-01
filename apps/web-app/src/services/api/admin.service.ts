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
  School,
  Department,
} from '@/shared/types/admin';

import {
  MOCK_DASHBOARD_STATS,
  MOCK_RECENT_ACTIVITIES,
} from '@/modules/admin/constants';
import { httpService, chatHttpService } from './http.service';

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
  return httpService.get<PaginatedResponse<AdminUser>>('/admin/users', {
    params: params as unknown as Record<string, unknown>,
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
  return httpService.post<AdminUser>('/admin/users', payload);
}

export async function deleteUser(userId: number): Promise<void> {
  return httpService.delete<void>(`/admin/users/${userId}`);
}

export async function lockUser(userId: number): Promise<void> {
  return httpService.patch<void>(`/admin/users/${userId}/lock`);
}

export async function unlockUser(userId: number): Promise<void> {
  return httpService.patch<void>(`/admin/users/${userId}/unlock`);
}

export async function resetUserPassword(userId: number): Promise<string> {
  return httpService.post<string>(`/admin/users/${userId}/reset-password`);
}

// ---- Statistics ----

export async function getMessageStats(): Promise<MessageStatPoint[]> {
  const response = await chatHttpService.get<{ data: MessageStatPoint[] }>('/admin/stats/messages');
  return response.data;
}

export async function getUserGrowthStats(): Promise<UserGrowthPoint[]> {
  return httpService.get<UserGrowthPoint[]>('/admin/stats/user-growth');
}

export async function getTopActiveUsers(): Promise<TopActiveUser[]> {
  return httpService.get<TopActiveUser[]>('/admin/stats/top-users');
}

export async function getUserSummary(): Promise<{
  totalAccounts: number;
  activeNow: number;
  lockedAccounts: number;
}> {
  return httpService.get('/admin/users/summary');
}

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  role: string;
  departmentId?: number | null;
}

export async function updateUser(
  userId: number,
  payload: UpdateUserPayload,
): Promise<AdminUser> {
  return httpService.put<AdminUser>(`/admin/users/${userId}`, payload);
}

// ---- School & Department Management ----

export async function getSchools(): Promise<School[]> {
  return httpService.get<School[]>('/schools');
}

export async function renameSchool(schoolId: number, name: string): Promise<void> {
  return httpService.put<void>(`/admin/schools/${schoolId}?name=${encodeURIComponent(name)}`);
}

export async function getDepartmentsBySchool(schoolId: number): Promise<Department[]> {
  return httpService.get<Department[]>(`/schools/${schoolId}/departments`);
}

export async function getAllDepartments(): Promise<Department[]> {
  return httpService.get<Department[]>('/admin/departments');
}

export async function createDepartment(schoolId: number, name: string): Promise<Department> {
  return httpService.post<Department>(`/admin/departments?schoolId=${schoolId}&name=${encodeURIComponent(name)}`);
}

export async function updateDepartment(id: number, name: string): Promise<Department> {
  return httpService.put<Department>(`/admin/departments/${id}?name=${encodeURIComponent(name)}`);
}

export async function deleteDepartment(id: number): Promise<void> {
  return httpService.delete<void>(`/admin/departments/${id}`);
}

export async function importUsersFromExcel(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  return httpService.post<void>("/admin/users/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}
