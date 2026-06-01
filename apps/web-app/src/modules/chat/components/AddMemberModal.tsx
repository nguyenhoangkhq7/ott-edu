import React, { useState, useEffect } from "react";
import { X, Search, UserPlus, Check, UserCheck } from "lucide-react";
import Image from "next/image";
import { User } from "../types";
import { searchUsersApi } from "../chatApi"; 

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (email: string) => Promise<void>;
  existingMemberIds?: string[];
  suggestedUsers?: User[]; // 🚀 Thêm prop này để nhận danh sách gợi ý từ ngoài vào
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddMember,
  existingMemberIds = [],
  suggestedUsers = [] // Mặc định là mảng rỗng nếu không truyền
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [globalUsers, setGlobalUsers] = useState<User[]>([]); // Đổi tên cho rõ nghĩa
  const [isLoading, setIsLoading] = useState(false);
  const [addedEmails, setAddedEmails] = useState<string[]>([]);

  // Reset state mỗi khi mở lại modal cho sạch sẽ
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setSearchQuery("");
        setGlobalUsers([]);
        setAddedEmails([]);
      });
    }
  }, [isOpen]);

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
      }, 500); // 500ms delay giống hệt Sidebar

      return () => clearTimeout(delayDebounce);
    } else {
      setGlobalUsers([]); // Nếu xóa chữ đi thì clear kết quả global
    }
  }, [searchQuery, isOpen]);

  if (!isOpen) return null;

  const handleAdd = async (email: string) => {
    try {
      await onAddMember(email);
      setAddedEmails((prev) => [...prev, email]);
    } catch (error) {
      console.error(error);
    }
  };

  // 🚀 QUYẾT ĐỊNH XEM HIỂN THỊ MẢNG NÀO (GỢI Ý HAY GLOBAL)
  const isSearchingText = searchQuery.trim().length > 1;
  const usersToDisplay = isSearchingText ? globalUsers : suggestedUsers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-800">Thêm thành viên</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-b border-slate-100 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên, email, MSSV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* 👇 Tiêu đề phân biệt trạng thái tìm kiếm 👇 */}
          {!isLoading && usersToDisplay.length > 0 && (
             <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
               {isSearchingText ? "Kết quả tìm kiếm" : "Gợi ý thêm vào nhóm"}
             </p>
          )}

          {isLoading ? (
            <p className="text-center text-sm text-slate-400 mt-4">Đang tải danh sách...</p>
          ) : usersToDisplay.length === 0 ? (
            <p className="text-center text-sm text-slate-400 mt-4">
              {isSearchingText ? "Không tìm thấy người dùng." : "Không có gợi ý nào."}
            </p>
          ) : (
            <div className="space-y-1 mt-1">
              {usersToDisplay.map((user) => {
                // ÉP KIỂU AN TOÀN KHÔNG DÙNG ANY ĐỂ VƯỢT ESLINT
                const extUser = user as User & { _id?: string; fullName?: string; code?: string };
                
                // 🚀 LẤY ĐẦY ĐỦ CẢ ID LẪN EMAIL ĐỂ QUÉT
                const userId = extUser.id || extUser._id || "";
                const userEmail = extUser.email || "";
                
                const displayName = extUser.fullName || extUser.name || (userEmail ? userEmail.split('@')[0] : "Người dùng");
                const displayCode = extUser.code;
                
                // 🚀 FIX LỖI Ở ĐÂY: Quét chéo cả ID lẫn Email, đảm bảo không lọt lưới 1 ai
                const isAlreadyInGroup = existingMemberIds.includes(userId) || (userEmail !== "" && existingMemberIds.includes(userEmail));
                
                const isJustAdded = addedEmails.includes(userEmail);
                const isDisabled = isAlreadyInGroup || isJustAdded;

                return (
                  <div key={userId || userEmail} className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <Image
                        src={user.avatarUrl || `https://i.pravatar.cc/150?u=${userEmail}`}
                        alt={displayName}
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        {/* HIỂN THỊ TÊN IN ĐẬM VÀ EMAIL (KÈM MSSV) */}
                        <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {displayCode ? `MSSV: ${displayCode} - ${userEmail}` : userEmail}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => !isDisabled && handleAdd(userEmail)}
                      disabled={isDisabled}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        isAlreadyInGroup 
                          ? "bg-slate-100 text-slate-500 cursor-not-allowed" // Đã trong nhóm
                          : isJustAdded
                          ? "bg-emerald-100 text-emerald-700 cursor-not-allowed" // Vừa mới thêm
                          : "bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white" // Chưa có
                      }`}
                      title={isAlreadyInGroup ? "Đã trong nhóm" : isJustAdded ? "Đã thêm" : "Thêm vào nhóm"}
                    >
                      {isAlreadyInGroup ? (
                        <><UserCheck size={14} /> <span className="hidden sm:inline">Đã trong nhóm</span></>
                      ) : isJustAdded ? (
                        <><Check size={14} /> <span className="hidden sm:inline">Đã thêm</span></>
                      ) : (
                        <><UserPlus size={14} /> <span className="hidden sm:inline">Thêm</span></>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};