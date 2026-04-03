import {
  apiClient,
  clearAllTokens,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "../api";

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

type ApiSuccessEnvelope<T> = {
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

function toErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const maybeData = (error as { response?: { data?: { message?: string } | string } }).response?.data;

    if (typeof maybeData === "string" && maybeData.length > 0) {
      return maybeData;
    }

    if (typeof maybeData === "object" && maybeData !== null && "message" in maybeData) {
      const message = (maybeData as { message?: string }).message;
      if (typeof message === "string" && message.length > 0) {
        return message;
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể đăng nhập lúc này.";
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  try {
    const response = await apiClient.post<LoginResponse, LoginPayload>("/auth/login", payload);
    await setAccessToken(response.accessToken);
    await setRefreshToken(response.refreshToken);
    return response.user;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function restoreSession(): Promise<AuthUser | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const refreshResponse = await apiClient.post<RefreshResponse, { refreshToken: string }>("/auth/refresh", {
      refreshToken,
    });
    await setAccessToken(refreshResponse.accessToken);
    await setRefreshToken(refreshResponse.refreshToken);

    const meResponse = await apiClient.get<AuthUser>("/auth/me");
    return meResponse;
  } catch {
    await clearAllTokens();
    return null;
  }
}

export async function refreshSession(): Promise<RefreshResponse> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error("Missing refresh token.");
  }

  try {
    const refreshResponse = await apiClient.post<RefreshResponse, { refreshToken: string }>("/auth/refresh", {
      refreshToken,
    });
    await setAccessToken(refreshResponse.accessToken);
    await setRefreshToken(refreshResponse.refreshToken);
    return refreshResponse;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function logout(): Promise<void> {
  try {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await apiClient.post<unknown, { refreshToken: string }>("/auth/logout", { refreshToken });
    }
  } finally {
    await clearAllTokens();
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  try {
    return await apiClient.get<AuthUser>("/auth/me");
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function getSchools(): Promise<SchoolOption[]> {
  try {
    const response = await apiClient.get<ApiSuccessEnvelope<SchoolOption[]>>("/schools");
    return response.data;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function getDepartmentsBySchoolId(schoolId: number): Promise<DepartmentOption[]> {
  try {
    const response = await apiClient.get<ApiSuccessEnvelope<DepartmentOption[]>>(`/schools/${schoolId}/departments`);
    return response.data;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function registerAccount(payload: RegisterPayload): Promise<string> {
  try {
    const response = await apiClient.post<ApiSuccessEnvelope<string>, RegisterPayload>("/auth/register", payload);
    return response.data || "Tạo tài khoản thành công!";
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}
