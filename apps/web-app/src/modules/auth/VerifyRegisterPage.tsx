"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerAccount, sendRegisterOtp, verifyOtp } from "@/services/auth/auth.service";
import { getRegisterOtpState, setRegisterOtpState, clearRegisterOtpState } from "@/services/auth/otp-flow-store";

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length <= 1) {
    return {
      firstName: parts[0] ?? "",
      lastName: "",
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export default function VerifyRegisterPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(48); // 48 seconds
  const [maskedEmail, setMaskedEmail] = useState("m***@example.com");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const otpState = getRegisterOtpState();
    if (!otpState) {
      router.replace("/register");
      return;
    }
    setMaskedEmail(otpState.maskedEmail);
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

    const state = getRegisterOtpState();
    if (!state) {
      router.replace("/register");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // 1. Verify OTP first to get the verified token
      const response = await verifyOtp({
        challengeId: state.challengeId,
        otpCode: otp.join(""),
        purpose: "REGISTER",
      });

      // 2. Register account immediately using saved form data + verifiedToken
      const normalizedName = splitFullName(state.form.fullName);
      const responseMessage = await registerAccount({
        email: state.email,
        password: state.form.password,
        firstName: normalizedName.firstName,
        lastName: normalizedName.lastName,
        roleName: "ROLE_STUDENT",
        code: state.code.trim(),
        schoolId: 1, // DEFAULT_SCHOOL_ID
        departmentId: Number(state.departmentId),
        verifiedToken: response.verifiedToken,
      });

      setSuccess(responseMessage || "Đăng ký tài khoản thành công! Đang chuyển hướng đăng nhập...");
      clearRegisterOtpState();
      
      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Xác thực OTP thất bại.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    const state = getRegisterOtpState();
    if (!state || !state.email) {
      router.replace("/register");
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      const response = await sendRegisterOtp({ email: state.email });
      setRegisterOtpState(response.challengeId, response.maskedEmail, state.email, state.form, state.code, state.departmentId);
      setMaskedEmail(response.maskedEmail);
      setTimeLeft(48);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setSuccess("Mã OTP mới đã được gửi thành công!");
    } catch (resendError) {
      const message = resendError instanceof Error ? resendError.message : "Không thể gửi lại mã OTP.";
      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100">
          <h2 className="mb-3 text-2xl font-bold text-slate-900">
            Xác thực tài khoản
          </h2>
          
          <p className="mb-6 text-sm text-slate-600">
            Để bảo mật, chúng tôi đã gửi một mã xác thực 6 số đến{" "}
            <span className="font-semibold text-indigo-600">{maskedEmail}</span>. Vui lòng nhập mã để hoàn tất đăng ký.
          </p>

          {error && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 font-medium">
              {error}
            </p>
          )}

          {success && (
            <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 font-medium">
              {success}
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
                  className="h-12 w-12 rounded-xl border border-slate-200 text-center text-lg font-semibold text-slate-800 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={!otp.every(digit => digit !== "") || isLoading}
              className="mb-4 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/10 transition-colors hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Đang xử lý..." : "Xác thực và hoàn tất"}
            </button>
          </form>

          <div className="text-center">
            <p className="mb-3 text-xs text-slate-500 font-semibold tracking-wider">GỬI LẠI MÃ SAU</p>
            <div className="mb-3 flex items-center justify-center gap-2">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-indigo-600">
                  {Math.floor(timeLeft / 60).toString().padStart(2, "0")}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">PHÚT</span>
              </div>
              <span className="text-2xl font-bold text-slate-300">:</span>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-indigo-600">
                  {(timeLeft % 60).toString().padStart(2, "0")}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">GIÂY</span>
              </div>
            </div>
            
            {timeLeft === 0 && (
              <button
                onClick={handleResendCode}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
              >
                Tôi chưa nhận được mã OTP
              </button>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6 text-xs text-slate-400 font-medium">
            <a href="#" className="hover:text-slate-600">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-slate-600">Chính sách bảo mật</a>
            <span>© 2026 OTT Edu</span>
          </div>
        </div>
      </div>
    </div>
  );
}
