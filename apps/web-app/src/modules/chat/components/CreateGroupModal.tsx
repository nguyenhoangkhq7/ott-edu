import React, { useState, useEffect } from "react";
import { X, Search, Check } from "lucide-react";
import Image from "next/image";
import { User } from "../types";
import { searchUsersApi } from "../chatApi"; 

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, selectedIds: string[]) => Promise<void>;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreateGroup }) => {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  // Đã đổi state thành selectedIds
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setGroupName("");
      setSearchQuery("");
      setSelectedIds([]); // Reset lại id
      return;
    }
    
    const fetchUsers = async () => {
      try {
        const res = await searchUsersApi(searchQuery) as { data: User[] };
        setUsers(res.data || []);
      } catch (error) {
        console.error("Lỗi:", error);
      }
    };

    const delay = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(delay);
  }, [searchQuery, isOpen]);

  if (!isOpen) return null;

  // Đổi hàm nhận tham số id thay vì email
  const toggleUserSelection = (id: string) => {
    if (!id) return;
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!groupName.trim() || selectedIds.length === 0) return;
    setIsCreating(true);
    try {
      // Gửi selectedIds xuống API
      await onCreateGroup(groupName, selectedIds);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-800">Tạo nhóm mới</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Tên nhóm */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Tên nhóm</label>
            <input
              type="text"
              placeholder="Nhập tên nhóm..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Thanh tìm kiếm */}
          <div>
            <label className="mb-1.5 flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Thành viên</span>
              {/* Hiển thị số lượng dựa trên mảng IDs */}
              <span className="text-blue-500">Đã chọn {selectedIds.length}</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Tìm bạn bè..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Danh sách User */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {users.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-4">Không tìm thấy người dùng.</p>
          ) : (
            users.map((user) => {
              // Lấy id an toàn (đề phòng backend trả về _id thay vì id)
              const userId = user.id || (user as User & { _id?: string })._id || "";
              const isSelected = selectedIds.includes(userId);
              
              return (
                <div 
                  key={userId} 
                  onClick={() => toggleUserSelection(userId)}
                  className="flex cursor-pointer items-center justify-between rounded-xl p-2 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Image src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.email}`} alt={user.name} width={40} height={40} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-slate-300"}`}>
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-slate-100 p-4">
          <button
            onClick={handleSubmit}
            disabled={!groupName.trim() || selectedIds.length === 0 || isCreating}
            className="w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400"
          >
            {isCreating ? "Đang tạo..." : "Tạo nhóm ngay"}
          </button>
        </div>
      </div>
    </div>
  );
};