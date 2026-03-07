import axiosClient from "../../shared/api/axios";
import {
  clearAllTokens,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "../../shared/api/token-store";

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

  return "Khong the dang nhap luc nay.";
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  try {
    const response = await axiosClient.post<LoginResponse>("/auth/login", payload);
    await setAccessToken(response.data.accessToken);
    await setRefreshToken(response.data.refreshToken);
    return response.data.user;
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
    const refreshResponse = await axiosClient.post<RefreshResponse>("/auth/refresh", { refreshToken });
    await setAccessToken(refreshResponse.data.accessToken);
    await setRefreshToken(refreshResponse.data.refreshToken);

    const meResponse = await axiosClient.get<AuthUser>("/auth/me");
    return meResponse.data;
  } catch {
    await clearAllTokens();
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await axiosClient.post("/auth/logout", { refreshToken });
    }
  } finally {
    await clearAllTokens();
  }
}
