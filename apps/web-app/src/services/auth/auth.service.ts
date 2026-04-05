import { httpService } from "@/services/api";

export type LoginPayload = {
  email: string;
  password: string;
};

export type OtpPurpose = "FORGOT_PASSWORD" | "CHANGE_PASSWORD";

export type AuthUser = {
  accountId: number;
  email: string;
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
  schoolId: 1;
  departmentId: number;
};

export type ForgotPasswordPayload = {
  email: string;
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

export type ResetPasswordPayload = {
  verifiedToken: string;
  newPassword: string;
  confirmPassword: string;
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
  return httpService.get<SchoolOption[]>("/schools");
}

export async function getDepartmentsBySchoolId(schoolId: number): Promise<DepartmentOption[]> {
  return httpService.get<DepartmentOption[]>(`/schools/${schoolId}/departments`);
}

export async function registerAccount(payload: RegisterPayload): Promise<string> {
  const response = await httpService.post<string>("/auth/register", payload);
  return response || "Tao tai khoan thanh cong!";
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<OtpChallenge> {
  return httpService.post<OtpChallenge>("/auth/forgot-password", payload);
}

export async function sendChangePasswordOtp(): Promise<OtpChallenge> {
  return httpService.post<OtpChallenge>("/auth/send-change-password-otp", {});
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResult> {
  return httpService.post<VerifyOtpResult>("/auth/verify-otp", payload);
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<string> {
  return httpService.post<string>("/auth/reset-password", payload);
}

export async function changePassword(payload: ChangePasswordPayload): Promise<string> {
  return httpService.post<string>("/auth/change-password", payload);
}

export async function updateCurrentUser(payload: UpdateProfilePayload): Promise<AuthUser> {
  return httpService.patch<AuthUser>("/auth/me", payload);
}

export async function uploadAvatar(file: File): Promise<UploadAvatarResult> {
  const formData = new FormData();
  formData.append("file", file);

  return httpService.post<UploadAvatarResult>("/auth/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}