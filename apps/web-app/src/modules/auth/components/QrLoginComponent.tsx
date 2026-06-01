"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useSocket, useSocketListener } from "@/shared/hooks/useSocket";
import { useAuth } from "@/shared/providers/AuthProvider";
import { registerSession, setActiveSessionClassId } from "@/services/api/token-store";
import { initQrSession, getCurrentUser, type AuthUser } from "@/services/auth/auth.service";
import { Loader2, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";

export default function QrLoginComponent() {
  const router = useRouter();
  const { setUser } = useAuth();
  const socket = useSocket();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Khởi tạo QR Code session
  const fetchNewQrSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);
      setSessionId(null);

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      const response = await initQrSession();
      setSessionId(response.qrSessionId);
      setExpiresIn(response.expiresIn);
      setIsLoading(false);

      // Bắt đầu đếm ngược
      let timeLeft = response.expiresIn;
      countdownIntervalRef.current = setInterval(() => {
        timeLeft -= 1;
        setExpiresIn(timeLeft);
        if (timeLeft <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
        }
      }, 1000);
    } catch (err) {
      console.error("Lỗi khởi tạo QR code:", err);
      setError("Không thể tải mã QR. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNewQrSession();

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Khi có socket và sessionId, join vào qr room (chỉ chạy khi socket hoặc sessionId thay đổi)
  useEffect(() => {
    if (socket && sessionId) {
      console.log(`📡 [Socket] Emitting join_qr_login_room for session: ${sessionId}`);
      socket.emit("join_qr_login_room", { sessionId });
    }
  }, [socket, sessionId]);

  // Lắng nghe sự kiện login thành công từ socket
  useSocketListener(socket, "qr_login_success", async (loginResponse: { accessToken: string; user: AuthUser }) => {
    try {
      console.log("🎉 [Socket] Nhận sự kiện đăng nhập QR thành công:", loginResponse);
      setIsSuccess(true);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      // 1. Đăng ký session mới vào pool đa tài khoản
      registerSession(
        loginResponse.accessToken,
        "", // QR login doesn't return refresh token through socket directly
        loginResponse.user
      );

      // 2. Đồng bộ user lên Auth Context
      setUser(loginResponse.user);

      // 3. Thiết lập thông tin Lớp học (classId) và Email vào sessionStorage để đồng bộ theo tab
      const latestUser = await getCurrentUser();
      const typedUser = latestUser as { email?: string; roles?: string[]; teams?: Array<{ id: number | string }> } | null;
      const userTeams = typedUser?.teams || [];
      const userClassId = userTeams.length > 0 ? userTeams[0].id.toString() : "60d5ecb8b3112a445c742301";
      const userEmail = typedUser?.email || loginResponse.user?.email || "";

      sessionStorage.setItem("userEmail", userEmail);
      if (userClassId) {
        setActiveSessionClassId(userClassId);
      }

      // 4. Chuyển hướng theo vai trò (Role-based redirect)
      const isAdmin = typedUser?.roles?.some(
        (role: string) =>
          role === "ROLE_ADMIN" ||
          role === "ROLE_SUPER_ADMIN" ||
          role.includes("ADMIN")
      );

      setTimeout(() => {
        if (isAdmin) {
          router.replace("/admin");
        } else {
          router.replace("/calendar");
        }
      }, 1500);

    } catch (err) {
      console.error("Lỗi xử lý đăng nhập QR thành công:", err);
      setError("Đăng nhập thất bại. Vui lòng quét lại.");
    }
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isExpired = expiresIn <= 0 && !isLoading && sessionId;
  const qrValue = sessionId || "";

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Khung chứa mã QR với thiết kế premium */}
      <div className="relative flex items-center justify-center w-64 h-64 p-4 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100/80 transition-all duration-300 hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)]">
        
        {/* Đường quét laser chạy động tăng tính hiện đại */}
        {!isLoading && !isExpired && !isSuccess && (
          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse top-4" style={{
            animation: 'scan 2s linear infinite',
            boxShadow: '0 0 8px #6366f1'
          }} />
        )}

        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <span className="text-xs font-medium text-slate-400">Đang tạo mã QR...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center text-center p-4 gap-3">
            <ShieldAlert className="w-12 h-12 text-rose-500" />
            <span className="text-xs font-semibold text-rose-500">{error}</span>
            <button
              onClick={fetchNewQrSession}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Tải lại
            </button>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col items-center text-center p-4 gap-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 animate-bounce" />
            <span className="text-sm font-bold text-slate-800">Đăng nhập thành công!</span>
            <span className="text-xs text-slate-400">Đang chuẩn bị vào hệ thống...</span>
          </div>
        ) : (
          <div className="relative">
            {/* Mã QR chính */}
            <QRCodeSVG
              value={qrValue}
              size={210}
              level="M"
              includeMargin={true}
            />

            {/* Lớp phủ Glassmorphism khi hết hạn */}
            {isExpired && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl transition-all duration-300">
                <div className="flex flex-col items-center gap-3 p-4">
                  <span className="text-xs font-bold text-slate-700 text-center">Mã QR đã hết hạn</span>
                  <button
                    onClick={fetchNewQrSession}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-200 transition-all duration-200 active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin-slow" />
                    Làm mới mã QR
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thông tin đếm ngược và chỉ dẫn */}
      {!isLoading && !isSuccess && !error && (
        <div className="flex flex-col items-center mt-5 w-full gap-2">
          {!isExpired ? (
            <>
              <div className="flex items-center gap-1.5 bg-indigo-50/70 border border-indigo-100/60 px-3 py-1 rounded-full">
                <span className="inline-block w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
                <span className="text-xs font-bold text-indigo-700">Hiệu lực: {formatTime(expiresIn)}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium text-center mt-1 px-4 leading-relaxed">
                Mở ứng dụng <strong className="text-slate-800 font-semibold">SmileEdu</strong> trên điện thoại di động, vào phần quét mã QR để bắt đầu xác nhận đăng nhập.
              </p>
            </>
          ) : (
            <p className="text-xs text-rose-500 font-medium text-center">
              Mã QR đã hết hạn hiệu lực bảo mật (3 phút). Vui lòng nhấn nút làm mới để tạo mã mới.
            </p>
          )}
        </div>
      )}

      {/* CSS Keyframes injected directly for scanning effect */}
      <style jsx global>{`
        @keyframes scan {
          0% {
            top: 16px;
          }
          50% {
            top: 224px;
          }
          100% {
            top: 16px;
          }
        }
      `}</style>
    </div>
  );
}
