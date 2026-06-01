import React, { useState, useEffect } from "react";
import { X, Search, Check } from "lucide-react";
import Image from "next/image";
import { User } from "../types";
import { searchUsersApi } from "../chatApi"; 

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, selectedIds: string[]) => Promise<void>;
  suggestedUsers?: User[]; // Nhận danh sách gợi ý từ cha truyền xuống
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreateGroup,
  suggestedUsers = [] // Mặc định mảng rỗng
}) => {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [globalUsers, setGlobalUsers] = useState<User[]>([]); 
  const [defaultUsers, setDefaultUsers] = useState<User[]>([]); // 🚀 State mới: chứa list mặc định khi vừa mở modal
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🚀 Đã sửa: Reset state khi đóng, và TỰ ĐỘNG FETCH khi mở Modal
  useEffect(() => {
    if (!isOpen) {
      queueMicrotask(() => {
        setGroupName("");
        setSearchQuery("");
        setGlobalUsers([]);
        setDefaultUsers([]);
        setSelectedIds([]);
        setIsLoading(false);
      });
    } else {
      // Khi Modal mở lên, nếu mảng suggestedUsers từ cha truyền vào bị rỗng -> Tự đi gọi API lấy danh sách mặc định
      if (suggestedUsers.length === 0) {
        const fetchDefaultUsers = async () => {
          setIsLoading(true);
          try {
            const res = await searchUsersApi("") as { data: User[] }; // Truyền rỗng để lấy top user
            setDefaultUsers(res.data || []);
          } catch (error) {
            console.error("Lỗi lấy danh sách gợi ý mặc định:", error);
          } finally {
            setIsLoading(false);
          }
        };
        fetchDefaultUsers();
      }
    }
  }, [isOpen, suggestedUsers.length]);
  
  // 🚀 LOGIC TÌM KIẾM GLOBAL CÓ DEBOUNCE (CHỐNG SPAM)
  useEffect(() => {
    if (!isOpen) return;

    const normalized = searchQuery.trim();
    if (normalized.length > 1) {
      setIsLoading(true);
      
      const delayDebounce = setTimeout(async () => {
        try {
          const res = await searchUsersApi(normalized) as { data: User[] };
          setGlobalUsers(res.data || []);
        } catch (error) {
          console.error("Lỗi tìm kiếm:", error);
        } finally {
          setIsLoading(false);
        }
      }, 500); // 500ms delay

      return () => clearTimeout(delayDebounce);
    } else {
      setGlobalUsers([]); // Xóa chữ thì clear kết quả tìm kiếm
    }
  }, [searchQuery, isOpen]);

  if (!isOpen) return null;

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
      await onCreateGroup(groupName, selectedIds);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  // 🚀 QUYẾT ĐỊNH XEM HIỂN THỊ MẢNG NÀO (Tìm kiếm > Gợi ý cha truyền > Gợi ý tự lấy)
  const isSearchingText = searchQuery.trim().length > 1;
  const usersToDisplay = isSearchingText 
    ? globalUsers 
    : (suggestedUsers.length > 0 ? suggestedUsers : defaultUsers);

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
              <span className="text-blue-500">Đã chọn {selectedIds.length}</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Tìm bạn bè, MSSV, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Danh sách User */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {/* Tiêu đề phân biệt trạng thái tìm kiếm */}
          {!isLoading && usersToDisplay.length > 0 && (
             <p className="px-3 pt-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
               {isSearchingText ? "Kết quả tìm kiếm" : "Gợi ý (Bạn bè/Lớp)"}
             </p>
          )}

          {isLoading ? (
            <p className="text-center text-sm text-slate-400 py-4">Đang tải danh sách...</p>
          ) : usersToDisplay.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-4">
              {isSearchingText ? "Không tìm thấy người dùng." : "Không có gợi ý nào."}
            </p>
          ) : (
            usersToDisplay.map((user) => {
              // Lấy id an toàn vượt ESLint
              const userId = user.id || (user as User & { _id?: string })._id || "";
              
              // Ép kiểu an toàn để hiển thị MSSV và Tên đầy đủ
              const extUser = user as User & { fullName?: string; code?: string };
              const displayName = extUser.fullName || extUser.name || (extUser.email ? extUser.email.split('@')[0] : "Người dùng");
              const displayCode = extUser.code;
              
              const isSelected = selectedIds.includes(userId);
              
              return (
                <div 
                  key={userId} 
                  onClick={() => toggleUserSelection(userId)}
                  className="flex cursor-pointer items-center justify-between rounded-xl p-2 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Image 
                      src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.email}`} 
                      alt={displayName} 
                      width={40} 
                      height={40} 
                      className="h-10 w-10 shrink-0 rounded-full object-cover" 
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
                      <p className="truncate text-xs text-slate-500">
                        {displayCode ? `MSSV: ${displayCode} - ${user.email}` : user.email}
                      </p>
                    </div>
                  </div>
                  {/* Nút tick chọn UI */}
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-slate-300"}`}>
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