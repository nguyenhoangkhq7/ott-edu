"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { teamApi } from "@/services/api/teamApi";

export default function JoinTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code");
  const hasAutoJoined = useRef(false);

  const [joinCode, setJoinCode] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (codeParam && !hasAutoJoined.current) {
      hasAutoJoined.current = true;
      setJoinCode(codeParam);

      const autoJoin = async () => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
          const response = await teamApi.joinWithCode(codeParam.trim());
          if (response && response.id === -1) {
            setSuccess(response.name === "PENDING" ? (response.description || "Yêu cầu tham gia đã được gửi. Vui lòng chờ duyệt.") : "Yêu cầu tham gia đã được gửi.");
          } else {
            setSuccess("Tham gia lớp học thành công! Đang chuyển hướng...");
            setTimeout(() => {
              router.push("/teams");
            }, 1500);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Mã tham gia không hợp lệ hoặc lỗi kết nối.");
        } finally {
          setIsLoading(false);
        }
      };

      autoJoin();
    }
  }, [codeParam, router]);

  const handleBackToTeams = () => {
    router.push("/teams");
  };

  const handleAddTeamWithCode = async () => {
    if (joinCode.trim()) {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const response = await teamApi.joinWithCode(joinCode.trim());
        if (response && response.id === -1) {
          setSuccess(response.name === "PENDING" ? (response.description || "Yêu cầu tham gia đã được gửi. Vui lòng chờ duyệt.") : "Yêu cầu tham gia đã được gửi.");
        } else {
          setSuccess("Tham gia lớp học thành công! Đang chuyển hướng...");
          setTimeout(() => {
            router.push("/teams");
          }, 1500);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Mã tham gia không hợp lệ hoặc lỗi kết nối.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 1. Đã sửa đường dẫn chuyển sang trang tạo nhóm
  const handleCreateNewTeam = () => {
    router.push("/teams/create");
  };

  return (
    <div className="flex h-full">
      {/* Left Panel */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToTeams}
              className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-slate-900">Join a team</h2>
          </div>
          
          {/* 2. Đã gắn sự kiện onClick vào nút dấu + */}
          <button 
            onClick={handleCreateNewTeam}
            className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md bg-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Teams for you"
              className="flex-1 text-sm bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Empty state for left panel */}
        <div className="flex-1 p-4 text-center text-sm text-slate-500">
          No teams found
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
        {/* Message */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            You don&apos;t have any teams discoverable
          </h3>
          <p className="text-slate-600 mb-1">
            Try searching, join with a code, or create one.
          </p>
          <p className="text-sm text-slate-500">
            Not sure why you should create a team?{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Watch this
            </a>
          </p>
        </div>

        {/* Cards */}
        <div className="flex gap-6 max-w-3xl w-full">
          {/* Join with code card */}
          <div className="flex-1 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            {/* Icon */}
            <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center mb-6 mx-auto">
              <span className="text-2xl font-bold text-slate-600">#</span>
            </div>

            <h4 className="text-center font-medium text-slate-900 mb-4">
              Join a team with a code
            </h4>

            {/* Alerts */}
            {error && (
              <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-600 text-center">
                {success}
              </div>
            )}

            {/* Input */}
            <input
              type="text"
              value={joinCode}
              disabled={isLoading}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter join code."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 text-center placeholder:text-slate-400 disabled:bg-slate-100"
            />

            {/* Add team button */}
            <button
              onClick={handleAddTeamWithCode}
              disabled={!joinCode.trim() || isLoading}
              className="w-full py-2 px-4 border border-slate-300 rounded-md text-sm text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading && (
                <span className="inline-block w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
              )}
              {isLoading ? "Joining..." : "Add team"}
            </button>
          </div>

          {/* Create team card */}
          <div className="flex-1 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            {/* Icon */}
            <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>

            {/* People icons */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>

            {/* Create team button */}
            <button
              onClick={handleCreateNewTeam}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Create a new team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}