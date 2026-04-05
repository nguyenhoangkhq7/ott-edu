"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { forgotPassword, verifyOtp } from "@/services/auth/auth.service";
import { getForgotOtpState, setForgotOtpState, setForgotVerifiedToken } from "@/services/auth/otp-flow-store";

export default function VerifyIdentityPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(48); // 48 seconds
  const [maskedEmail, setMaskedEmail] = useState("m***@example.com");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const state = getForgotOtpState();
    if (!state) {
      router.replace("/forgot-password");
      return;
    }

    setMaskedEmail(state.maskedEmail);
  }, [router]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }
    
    setOtp(newOtp);
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.every(digit => digit !== "")) {
      return;
    }

    const state = getForgotOtpState();
    if (!state) {
      router.replace("/forgot-password");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await verifyOtp({
        challengeId: state.challengeId,
        otpCode: otp.join(""),
        purpose: "FORGOT_PASSWORD",
      });

      setForgotVerifiedToken(response.verifiedToken);
      router.push("/forgot-password/reset");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Khong the xac thuc OTP.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    const state = getForgotOtpState();
    if (!state || !state.email) {
      router.replace("/forgot-password");
      return;
    }

    setError(null);
    try {
      const response = await forgotPassword({ email: state.email });
      setForgotOtpState(response.challengeId, response.maskedEmail, state.email);
      setMaskedEmail(response.maskedEmail);
      setTimeLeft(48);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (resendError) {
      const message = resendError instanceof Error ? resendError.message : "Khong the gui lai OTP.";
      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-end gap-4">
          <button className="rounded-full p-2 hover:bg-slate-200">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="currentColor">
              <circle cx="12" cy="12" r="2" />
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
            </svg>
          </button>
          <button className="rounded-full p-2 hover:bg-slate-200">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-200 text-sm font-medium text-orange-700">
            AJ
          </div>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h2 className="mb-3 text-2xl font-bold text-slate-900">
            Verify your identity
          </h2>
          
          <p className="mb-6 text-sm text-slate-600">
            For your security, we&apos;ve sent a 6-digit code to{" "}
            <span className="font-medium text-slate-900">{maskedEmail}</span>. Please enter it below to continue.
          </p>

          {error && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6 flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="h-12 w-12 rounded-lg border-2 border-slate-300 text-center text-lg font-semibold text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={!otp.every(digit => digit !== "") || isLoading}
              className="mb-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Verifying..." : "Verify and continue"}
            </button>
          </form>

          <div className="text-center">
            <p className="mb-3 text-xs text-slate-500">RESEND IN</p>
            <div className="mb-3 flex items-center justify-center gap-2">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-blue-600">
                  {Math.floor(timeLeft / 60).toString().padStart(2, "0")}
                </span>
                <span className="text-xs text-slate-500">MIN</span>
              </div>
              <span className="text-2xl font-bold text-slate-300">:</span>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-blue-600">
                  {(timeLeft % 60).toString().padStart(2, "0")}
                </span>
                <span className="text-xs text-slate-500">SEC</span>
              </div>
            </div>
            
            {timeLeft === 0 && (
              <button
                onClick={handleResendCode}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                I didn&apos;t receive a code
              </button>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-700">Privacy Statement</a>
            <a href="#" className="hover:text-slate-700">Terms of Use</a>
            <span>© 2024 Microsoft</span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            <svg viewBox="0 0 24 24" className="mb-1 inline h-4 w-4" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>{" "}
            Secure verification by Microsoft Identity Service
          </p>
        </div>
      </div>
    </div>
  );
}
