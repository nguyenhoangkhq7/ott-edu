"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { ChatLayout } from "@/modules/chat";

export default function ChatPage() {
  const [userId, setUserId] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Khôi phục userId từ localStorage khi load trang
  useEffect(() => {
    const saved = localStorage.getItem("dev_user_id");
    if (saved) {
      setUserId(saved);
      setInputValue(saved);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    localStorage.setItem("dev_user_id", trimmed);
    setUserId(trimmed);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("dev_user_id");
    setUserId("");
    setInputValue("");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">OTT-Edu Chat</h1>
              <p className="text-xs text-gray-400">Dev Mode — Nhập User ID để test</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Dán <strong>MongoDB _id</strong> của người dùng từ kết quả chạy{" "}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5">seed.ts</code>{" "}
            vào ô bên dưới.
          </p>

          <div className="space-y-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Ví dụ: 6609a1b2c3d4e5f6a7b8c9d0"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
            />
            <button
              onClick={handleLogin}
              disabled={!inputValue.trim()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Vào Chat →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Dev Banner */}
      <div className="bg-amber-500 text-white text-xs px-4 py-1.5 flex items-center justify-between flex-shrink-0">
        <span>
          🔧 Dev Mode — User ID:{" "}
          <code className="font-mono bg-amber-600 px-1.5 py-0.5 rounded">{userId}</code>
        </span>
        <button
          onClick={handleLogout}
          className="underline hover:no-underline text-white/90 hover:text-white transition-colors"
        >
          Đổi User
        </button>
      </div>

      {/* Chat Layout */}
      <div className="flex-1 overflow-hidden p-3">
        <div className="h-full max-w-7xl mx-auto">
          <ChatLayout currentUserId={userId} />
        </div>
      </div>
    </div>
  );
}
