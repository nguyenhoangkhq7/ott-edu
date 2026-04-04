"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { forgotPassword } from "@/services/auth/auth.service";
import { getForgotOtpState, setForgotOtpState } from "@/services/auth/otp-flow-store";

export default function CheckEmailPage() {
  const router = useRouter();
  const [maskedEmail, setMaskedEmail] = useState("m***@example.com");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const state = getForgotOtpState();
    if (!state) {
      router.replace("/forgot-password");
      return;
    }

    setMaskedEmail(state.maskedEmail);
  }, [router]);

  const handleOpenEmail = () => {
    window.open("mailto:", "_blank");
  };

  const handleResendLink = async () => {
    const state = getForgotOtpState();
    if (!state) {
      router.replace("/forgot-password");
      return;
    }

    setError(null);
    try {
      if (!state.email) {
        throw new Error("Khong tim thay email de gui lai OTP.");
      }

      const response = await forgotPassword({ email: state.email });
      setForgotOtpState(response.challengeId, response.maskedEmail, state.email);
      setMaskedEmail(response.maskedEmail);
    } catch (resendError) {
      const message = resendError instanceof Error ? resendError.message : "Khong the gui lai ma OTP.";
      setError(message);
    }
  };

  const handleGoToVerify = () => {
    router.push("/forgot-password/verify");
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-slate-900">Microsoft Teams</span>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="mb-6 flex justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-100">
              <svg viewBox="0 0 24 24" className="h-16 w-16 text-blue-600" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
          </div>

          <h2 className="mb-3 text-center text-2xl font-bold text-slate-900">
            Check your email
          </h2>
          
          <p className="mb-6 text-center text-sm text-slate-600">
            We&apos;ve sent a 6-digit OTP code to <span className="font-medium text-slate-900">{maskedEmail}</span>. Please check your inbox to continue.
          </p>

          <button
            onClick={handleOpenEmail}
            className="mb-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Open Email App
          </button>

          <button
            onClick={handleGoToVerify}
            className="mb-4 w-full rounded-lg border border-blue-600 px-4 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            I already have the code
          </button>

          {error && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="text-center">
            <p className="text-sm text-slate-600">
              Didn&apos;t receive the email?{" "}
              <button
                onClick={handleResendLink}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Resend link
              </button>
            </p>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handleBackToLogin}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to login
            </button>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6 text-center">
            <p className="text-xs text-slate-500">
              Secure verification by Microsoft Identity Service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
