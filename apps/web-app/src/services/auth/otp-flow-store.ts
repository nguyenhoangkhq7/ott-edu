import type { OtpPurpose } from "@/services/auth/auth.service";

type OtpFlowState = {
  challengeId: string;
  maskedEmail: string;
  purpose: OtpPurpose;
  email?: string;
};

const FORGOT_STATE_KEY = "forgot-password-otp-state";
const CHANGE_STATE_KEY = "change-password-otp-state";
const FORGOT_VERIFIED_TOKEN_KEY = "forgot-password-verified-token";
const CHANGE_VERIFIED_TOKEN_KEY = "change-password-verified-token";

function saveState(key: string, state: OtpFlowState): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(key, JSON.stringify(state));
}

function loadState(key: string): OtpFlowState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as OtpFlowState;
  } catch {
    return null;
  }
}

function clearState(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(key);
}

function saveToken(key: string, token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(key, token);
}

function loadToken(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem(key);
}

function clearToken(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(key);
}

export function setForgotOtpState(challengeId: string, maskedEmail: string, email: string): void {
  saveState(FORGOT_STATE_KEY, {
    challengeId,
    maskedEmail,
    purpose: "FORGOT_PASSWORD",
    email,
  });
}

export function getForgotOtpState(): OtpFlowState | null {
  return loadState(FORGOT_STATE_KEY);
}

export function clearForgotOtpState(): void {
  clearState(FORGOT_STATE_KEY);
  clearToken(FORGOT_VERIFIED_TOKEN_KEY);
}

export function setForgotVerifiedToken(token: string): void {
  saveToken(FORGOT_VERIFIED_TOKEN_KEY, token);
}

export function getForgotVerifiedToken(): string | null {
  return loadToken(FORGOT_VERIFIED_TOKEN_KEY);
}

export function setChangeOtpState(challengeId: string, maskedEmail: string): void {
  saveState(CHANGE_STATE_KEY, {
    challengeId,
    maskedEmail,
    purpose: "CHANGE_PASSWORD",
  });
}

export function getChangeOtpState(): OtpFlowState | null {
  return loadState(CHANGE_STATE_KEY);
}

export function clearChangeOtpState(): void {
  clearState(CHANGE_STATE_KEY);
  clearToken(CHANGE_VERIFIED_TOKEN_KEY);
}

export function setChangeVerifiedToken(token: string): void {
  saveToken(CHANGE_VERIFIED_TOKEN_KEY, token);
}

export function getChangeVerifiedToken(): string | null {
  return loadToken(CHANGE_VERIFIED_TOKEN_KEY);
}
