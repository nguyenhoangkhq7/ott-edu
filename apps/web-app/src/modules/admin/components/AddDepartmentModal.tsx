"use client";

import { useState } from "react";
import Modal from "@/shared/components/ui/Modal";
import Input from "@/shared/components/ui/Input";

interface AddDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  schoolName: string;
}

export default function AddDepartmentModal({
  isOpen,
  onClose,
  onSubmit,
  schoolName,
}: AddDepartmentModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên phòng ban/khoa.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(name);
      setName("");
      onClose();
    } catch (err) {
      console.error(err);
      setError("Không thể thêm phòng ban/khoa. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm Phòng Ban / Khoa mới" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200 animate-in fade-in">
            {error}
          </div>
        )}

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
          <p className="text-[10px] uppercase font-bold text-slate-400">Trường / Học viện</p>
          <p className="text-xs font-bold text-slate-700 mt-0.5">{schoolName}</p>
        </div>

        <Input
          label="Tên Phòng Ban / Khoa"
          placeholder="Ví dụ: Khoa Công nghệ Thông tin"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isSubmitting}
        />

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
            {isSubmitting ? "Đang thêm..." : "Thêm mới"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
