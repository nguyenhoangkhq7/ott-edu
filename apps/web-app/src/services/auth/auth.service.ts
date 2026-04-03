import { httpService } from "@/services/api";

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  accountId: number;
  email: string;
  roles: string[];
  firstName: string | null;
  lastName: string | null;
  code: string | null;
  schoolId: number | null;
  departmentId: number | null;
  customSchool: string | null;
  customDepartment: string | null;
};

export type SchoolOption = {
  id: number;
  name: string;
};

export type DepartmentOption = {
  id: number;
  name: string;
  schoolId: number;
};

type ApiSuccessResponse<T> = {
  timestamp: string;
  status: number;
  message: string;
  data: T;
};

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleName: "ROLE_STUDENT";
  code: string;
  schoolId: 1;
  departmentId: number;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return httpService.post<LoginResponse>("/auth/login", payload);
}

export async function refreshSession(): Promise<RefreshResponse> {
  return httpService.post<RefreshResponse>("/auth/refresh", {});
}

export async function logout(): Promise<void> {
  await httpService.post<void>("/auth/logout", {});
}

export async function getCurrentUser(): Promise<AuthUser> {
  return httpService.get<AuthUser>("/auth/me");
}

export async function getSchools(): Promise<SchoolOption[]> {
  const response = await httpService.get<ApiSuccessResponse<SchoolOption[]>>("/schools");
  return response.data;
}

export async function getDepartmentsBySchoolId(schoolId: number): Promise<DepartmentOption[]> {
  const response = await httpService.get<ApiSuccessResponse<DepartmentOption[]>>(`/schools/${schoolId}/departments`);
  return response.data;
}

export async function registerAccount(payload: RegisterPayload): Promise<string> {
  const response = await httpService.post<ApiSuccessResponse<string>>("/auth/register", payload);
  return response.data || "Tao tai khoan thanh cong!";
}