"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { joinGroupApi } from "@/modules/chat";

export default function JoinGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("id");
  const hasJoined = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mode, setMode] = useState<"added" | "requested" | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setError("Mã liên kết nhóm không hợp lệ hoặc thiếu thông tin.");
      setIsLoading(false);
      return;
    }

    if (hasJoined.current) return;
    hasJoined.current = true;

    const performJoin = async () => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const res = await joinGroupApi(conversationId);
        setMode(res.mode);
        if (res.mode === "added") {
          setSuccess("Tham gia nhóm chat thành công! Đang chuyển hướng...");
          setTimeout(() => {
            router.push("/chat");
          }, 1500);
        } else {
          setSuccess("Đã gửi yêu cầu tham gia nhóm chat thành công. Vui lòng chờ quản trị viên duyệt!");
        }
      } catch (err: any) {
        console.error("Join group chat error:", err);
        let errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi tham gia nhóm chat.";
        // Nếu message là raw HTML (từ Express 404), thay bằng message thân thiện
        if (typeof errMsg === "string" && errMsg.trim().startsWith("<")) {
          errMsg = "Không thể tham gia nhóm chat. Vui lòng thử lại hoặc kiểm tra lại liên kết.";
        }
        setError(errMsg);
      } finally {
        setIsLoading(false);
      }
    };

    performJoin();
  }, [conversationId, router]);

  const handleGoToChat = () => {
    router.push("/chat");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 min-h-screen">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-sm border border-blue-100">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.9 1.9 0 01-1.22-.44l-2.23 2.23V16H3a2 2 0 01-2-2V10a2 2 0 012-2h4M9 4h6a2 2 0 012 2v6M9 4V2a2 2 0 00-2-2H2a2 2 0 00-2 2v4a2 2 0 002 2h2m5-4h2" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Tham gia nhóm chat
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          {isLoading ? "Đang xử lý yêu cầu tham gia nhóm..." : "Liên kết mời tham gia nhóm"}
        </p>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center my-6">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-sm text-slate-500 font-medium">Vui lòng chờ giây lát...</span>
          </div>
        )}

        {/* Success / Status Message */}
        {success && (
          <div className={`mb-6 p-4 rounded-2xl border text-sm text-center font-medium ${
            mode === "added" 
              ? "bg-green-50 border-green-200 text-green-700" 
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 text-center font-medium">
            {error}
          </div>
        )}

        {/* Button Action */}
        {!isLoading && (
          <button
            onClick={handleGoToChat}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.98]"
          >
            Quay lại trang Chat
          </button>
        )}
      </div>
    </div>
  );
}
