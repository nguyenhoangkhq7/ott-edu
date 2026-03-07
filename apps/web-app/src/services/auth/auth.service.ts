import { AxiosError } from "axios";

import apiClient from "@/shared/api/axios";

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

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleName: "ROLE_STUDENT" | "ROLE_INSTRUCTOR";
  code: string;
  schoolId: number | null;
  departmentId: number | null;
  customSchool: string | null;
  customDepartment: string | null;
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

function mapApiError(error: unknown): Error {
  if (error instanceof AxiosError) {
    const message =
      typeof error.response?.data === "string"
        ? error.response.data
        : (error.response?.data as { message?: string } | undefined)?.message;

    return new Error(message || "Khong the xu ly yeu cau luc nay.");
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Khong the xu ly yeu cau luc nay.");
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const response = await apiClient.post<LoginResponse>("/auth/login", payload);
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function refreshSession(): Promise<RefreshResponse> {
  try {
    const response = await apiClient.post<RefreshResponse>("/auth/refresh", {});
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout", {});
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  try {
    const response = await apiClient.get<AuthUser>("/auth/me");
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function getSchools(): Promise<SchoolOption[]> {
  try {
    const response = await apiClient.get<SchoolOption[]>("/schools");
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function getDepartmentsBySchoolId(schoolId: number): Promise<DepartmentOption[]> {
  try {
    const response = await apiClient.get<DepartmentOption[]>(`/schools/${schoolId}/departments`);
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function registerAccount(payload: RegisterPayload): Promise<string> {
  try {
    const response = await apiClient.post<string>("/auth/register", payload, {
      responseType: "text",
    });
    return response.data || "Tao tai khoan thanh cong!";
  } catch (error) {
    throw mapApiError(error);
  }
}