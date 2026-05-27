"use client";

import { useState } from "react";
import Modal from "@/shared/components/ui/Modal";
import type { Department } from "@/shared/types/admin";

interface DeleteDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  department: Department | null;
}

export default function DeleteDepartmentModal({
  isOpen,
  onClose,
  onConfirm,
  department,
}: DeleteDepartmentModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!department) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Không thể xóa phòng ban/khoa. Vui lòng thử lại.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xóa Phòng Ban / Khoa" maxWidth="sm">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-4 items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Xác nhận xóa?</p>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Bạn có chắc chắn muốn xóa phòng ban/khoa{" "}
              <strong className="text-slate-700">
                &quot;{department.name}&quot;
              </strong>
              ? Hành động này không thể hoàn tác và tất cả các liên kết với tài khoản sẽ bị ảnh hưởng.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-md border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center justify-center gap-2 px-4.5 py-2 rounded-md bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
