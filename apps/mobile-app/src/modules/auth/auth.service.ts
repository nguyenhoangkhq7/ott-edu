import {
  apiClient,
  API_URL,
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
  status: string | null;
  roles: string[];
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  code: string | null;
  schoolId: number | null;
  departmentId: number | null;
  departmentName: string | null;
};

export type OtpPurpose = "FORGOT_PASSWORD" | "CHANGE_PASSWORD";

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
  roleName: "ROLE_STUDENT";
  code: string;
  schoolId: number | null;
  departmentId: number | null;
  customSchool?: string | null;
  customDepartment?: string | null;
};

export type OtpChallenge = {
  challengeId: string;
  maskedEmail: string;
  expiresIn: number;
};

export type VerifyOtpPayload = {
  challengeId: string;
  otpCode: string;
  purpose: OtpPurpose;
};

export type VerifyOtpResult = {
  verifiedToken: string;
  expiresIn: number;
};

export type ChangePasswordPayload = {
  verifiedToken: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type UpdateProfilePayload = {
  fullName?: string;
  about?: string;
  phone?: string;
  avatarUrl?: string;
  departmentId?: number;
};

export type UploadAvatarResult = {
  avatarUrl: string;
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
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    const message = (error as { message: string }).message;
    const hasNoResponse =
      ("request" in error && !("response" in error)) || message.includes("Network Error");

    if (hasNoResponse) {
      return `Khong ket noi duoc den may chu (${API_URL}). Vui long kiem tra cung Wi-Fi va gateway 8088.`;
    }
  }

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
    return await apiClient.get<SchoolOption[]>("/schools");
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function getDepartmentsBySchoolId(schoolId: number): Promise<DepartmentOption[]> {
  try {
    return await apiClient.get<DepartmentOption[]>(`/schools/${schoolId}/departments`);
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function registerAccount(payload: RegisterPayload): Promise<string> {
  try {
    const response = await apiClient.post<string, RegisterPayload>("/auth/register", payload);
    return response || "Tạo tài khoản thành công!";
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function sendChangePasswordOtp(): Promise<OtpChallenge> {
  try {
    return await apiClient.post<OtpChallenge>("/auth/send-change-password-otp", {});
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResult> {
  try {
    return await apiClient.post<VerifyOtpResult, VerifyOtpPayload>("/auth/verify-otp", payload);
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function changePassword(payload: ChangePasswordPayload): Promise<string> {
  try {
    return await apiClient.post<string, ChangePasswordPayload>("/auth/change-password", payload);
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function updateCurrentUser(payload: UpdateProfilePayload): Promise<AuthUser> {
  try {
    return await apiClient.patch<AuthUser, UpdateProfilePayload>("/auth/me", payload);
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function uploadAvatar(file: { uri: string; name: string; type: string }): Promise<UploadAvatarResult> {
  try {
    const formData = new FormData();
    formData.append("file", file as unknown as Blob);

    return await apiClient.post<UploadAvatarResult, FormData>("/auth/me/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}
