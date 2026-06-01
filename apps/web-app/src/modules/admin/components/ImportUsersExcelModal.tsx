"use client";

import { useState } from "react";
import Modal from "@/shared/components/ui/Modal";

interface ImportUsersExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File) => Promise<void>;
}

export default function ImportUsersExcelModal({
  isOpen,
  onClose,
  onSubmit,
}: ImportUsersExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Vui lòng chọn một file Excel.");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      await onSubmit(file);
      setFile(null);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Lỗi khi nhập tài khoản. Vui lòng kiểm tra lại file Excel.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nhập tài khoản từ Excel" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200 animate-in fade-in">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-600">Chọn file Excel (.xlsx hoặc .xls)</span>
          <div className="relative flex items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-6 transition-colors group cursor-pointer bg-slate-50 hover:bg-emerald-50/20">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="text-center">
              <svg
                viewBox="0 0 24 24"
                className="mx-auto h-10 w-10 text-slate-400 group-hover:text-emerald-500 transition-colors"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="mt-2 text-xs font-medium text-slate-700">
                {file ? file.name : "Kéo thả file hoặc nhấp để chọn"}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Chỉ chấp nhận file định dạng Excel (XLSX, XLS)
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-md border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isUploading || !file}
            className="flex items-center justify-center gap-2 px-4.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? (
              <>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin text-white" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2v4" />
                </svg>
                <span>Đang tải lên...</span>
              </>
            ) : (
              "Tải lên"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
