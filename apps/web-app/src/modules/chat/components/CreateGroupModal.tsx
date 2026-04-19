import React, { useState } from "react";
import { User } from "../types";
import { X } from "lucide-react";
import Image from "next/image";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedUsers: User[];
  onCreateGroup: (name: string, selectedUserIds: string[]) => Promise<void>;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, suggestedUsers, onCreateGroup }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const toggleUser = (userId: string) => {
    setSelectedIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleSubmit = async () => {
    if (!groupName.trim() || selectedIds.length === 0) return;
    setIsLoading(true);
    try {
      await onCreateGroup(groupName, selectedIds);
      setGroupName("");
      setSelectedIds([]);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Tạo nhóm chat mới</h2>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Tên nhóm</label>
            <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Nhập tên nhóm..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Chọn thành viên ({selectedIds.length})</label>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {suggestedUsers.length === 0 ? (
                <p className="p-2 text-sm text-slate-500">Không có người dùng để gợi ý</p>
              ) : (
                suggestedUsers.map(user => (
                  <label key={user.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
                    <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleUser(user.id)} className="h-4 w-4 rounded border-slate-300" />
                    <Image src={user.avatarUrl} alt={user.name} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                    <span className="text-sm font-medium text-slate-700">{user.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Hủy</button>
            <button onClick={handleSubmit} disabled={isLoading || !groupName.trim() || selectedIds.length === 0} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {isLoading ? "Đang tạo..." : "Tạo nhóm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};