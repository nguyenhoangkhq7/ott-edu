"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendChangePasswordOtp } from "@/services/auth/auth.service";
import { clearChangeOtpState, setChangeOtpState } from "@/services/auth/otp-flow-store";

type VerificationMethod = "email" | "sms";

export default function ChangePasswordMethodPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async () => {
    if (selectedMethod !== "email") {
      setError("Hien tai chi ho tro gui OTP qua email.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      clearChangeOtpState();
      const response = await sendChangePasswordOtp();
      setChangeOtpState(response.challengeId, response.maskedEmail);
      router.push("/account/change-password/verify");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Khong the gui OTP luc nay.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/account");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <span className="text-base font-semibold text-slate-900">Microsoft Teams</span>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search"
              className="w-48 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button className="rounded-full p-1 hover:bg-slate-200">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
              </svg>
            </button>
            <button className="rounded-full p-1 hover:bg-slate-200">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="currentColor">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-200">
              <span className="text-sm font-medium text-amber-800">JD</span>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
            </div>
            <div>
              <h2 className="mb-1 text-xl font-semibold text-slate-900">Verify your identity</h2>
              <p className="text-sm text-slate-600">Security check required</p>
            </div>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-slate-700">
            To keep your account secure, we need to verify it&apos;s really you. Choose how you&apos;d like to receive your verification code to reset your password.
          </p>

          <div className="mb-6 space-y-3">
            {/* Email Option */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-colors ${
                selectedMethod === "email"
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="verification"
                value="email"
                checked={selectedMethod === "email"}
                onChange={(e) => setSelectedMethod(e.target.value as VerificationMethod)}
                className="mt-0.5 h-4 w-4 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  <span className="font-medium text-slate-900">Email a code</span>
                </div>
                <p className="text-sm text-slate-600">
                  We&apos;ll send a 6-digit code to joh***@company.com
                </p>
              </div>
            </label>

            {/* SMS Option */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-colors ${
                selectedMethod === "sms"
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="verification"
                value="sms"
                checked={selectedMethod === "sms"}
                onChange={(e) => setSelectedMethod(e.target.value as VerificationMethod)}
                className="mt-0.5 h-4 w-4 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" />
                  </svg>
                  <span className="font-medium text-slate-900">Text a code</span>
                </div>
                <p className="text-sm text-slate-600">
                  We&apos;ll text a code to your mobile phone ending in **42
                </p>
              </div>
            </label>
          </div>

          {error && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={handleNext}
            disabled={isLoading}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {isLoading ? "Sending..." : "Next"}
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>

          <div className="text-center">
            <button
              onClick={handleCancel}
              className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
            MICROSOFT SECURE AUTHENTICATION
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span>© 2024 Microsoft. All rights reserved.</span>
          <a href="#" className="hover:text-slate-700">Privacy & Cookies</a>
          <a href="#" className="hover:text-slate-700">Terms of use</a>
        </div>
      </div>
    </div>
  );
}
