"use client";

import { useState } from "react";
import { teamApi } from "@/services/api/teamApi";

interface AddTeamMemberModalProps {
  teamId: number;
  teamName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddTeamMemberModal({
  teamId,
  teamName,
  isOpen,
  onClose,
  onSuccess,
}: AddTeamMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "LEADER">("MEMBER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await teamApi.addMember(teamId, {
        email: email.trim(),
        role,
      });

      setSuccess(true);
      console.log("Thêm thành viên thành công:", response);
      
      // Reset form
      setEmail("");
      setRole("MEMBER");
      
      // Sau 1.5s đóng modal
      setTimeout(() => {
        onClose();
        setSuccess(false);
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể thêm thành viên"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Thêm thành viên vào lớp
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-xl"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Lớp: <strong>{teamName}</strong>
        </p>

        {success ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700">✓ Thêm thành viên thành công!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: student@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <p className="text-xs text-slate-500 mt-1">
                Nhập email của tài khoản muốn thêm vào lớp
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "MEMBER" | "LEADER")}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="MEMBER">Thành viên</option>
                <option value="LEADER">Trưởng lớp</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-md transition-colors ${
                  loading
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
                disabled={loading}
              >
                {loading ? "Đang thêm..." : "Thêm"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
