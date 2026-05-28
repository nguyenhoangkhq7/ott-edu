"use client";

import { useState, useEffect } from "react";
import Modal from "@/shared/components/ui/Modal";
import Input from "@/shared/components/ui/Input";
import type { AdminUser, FilterOption, Department } from "@/shared/types/admin";
import type { UpdateUserPayload } from "@/services/api/admin.service";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: UpdateUserPayload) => Promise<void>;
  user: AdminUser | null;
  roleOptions: FilterOption[];
  departments: Department[];
}

export default function EditUserModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  roleOptions,
  departments,
}: EditUserModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("Student");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exclude 'All Roles' option if present
  const selectableRoles = roleOptions.filter((opt) => opt.value !== "all");

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setRole(user.role || "Student");
      setDepartmentId(user.departmentId || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !role) {
      setError("Vui lòng điền đầy đủ các trường.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        firstName,
        lastName,
        role,
        departmentId: departmentId === "" ? null : Number(departmentId),
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError("Không thể cập nhật tài khoản. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sửa thông tin tài khoản" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200 animate-in fade-in">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Họ"
            placeholder="Nguyen"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <Input
            label="Tên"
            placeholder="An"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Custom select styling for Role */}
        <label className="flex w-full flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Vai trò</span>
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isSubmitting}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer"
            >
              {selectableRoles.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>
        </label>

        {/* Department Selection */}
        <label className="flex w-full flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Phòng Ban / Khoa</span>
          <div className="relative">
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : "")}
              disabled={isSubmitting}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer"
            >
              <option value="">Chưa chọn khoa / phòng ban (N/A)</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>
        </label>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 px-4.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
