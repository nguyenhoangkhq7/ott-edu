import React, { useState } from "react";
import { User, Conversation } from "../types";
import { X } from "lucide-react";
// Lưu ý: Nếu Image vẫn lỗi config, Hậu có thể đổi thành thẻ <img> như tui làm ở dưới cho an toàn
import Image from "next/image";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedUsers: User[];
  conversation: Conversation | null;
  onAddMembers: (
    conversationId: string,
    selectedUserIds: string[],
  ) => Promise<void>;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  suggestedUsers,
  conversation,
  onAddMembers,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !conversation) return null;

  const toggleUser = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;
    setIsLoading(true);
    try {
      await onAddMembers(conversation.id, selectedIds);
      setSelectedIds([]);
      onClose();
    } catch (error) {
      console.error("[AddMemberModal] Error adding members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Thêm thành viên
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="mb-3 text-sm text-slate-500">
            Thêm người vào nhóm:{" "}
            <strong className="text-slate-800">{conversation.name}</strong>
          </p>

          <div className="mb-4 max-h-60 overflow-y-auto rounded-xl border border-slate-200 p-2 shadow-inner">
            {suggestedUsers.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-400 italic">
                Không có dữ liệu người dùng.
              </p>
            ) : (
              suggestedUsers.map((user) => {
                // 🛠️ LOGIC QUAN TRỌNG: Ép ID về string để so sánh chính xác giữa MySQL và MongoDB
                const isAlreadyMember = conversation.participants.some(
                  (
                    p: User & {
                      _id?: string | number;
                      accountId?: string | number;
                    },
                  ) =>
                    String(p.id) === String(user.id) ||
                    String(p._id) === String(user.id) ||
                    String(p.accountId) === String(user.id),
                );

                return (
                  <label
                    key={user.id}
                    className={`flex items-center gap-3 rounded-lg p-2 transition-all ${
                      isAlreadyMember
                        ? "opacity-60 cursor-not-allowed bg-slate-50"
                        : "cursor-pointer hover:bg-blue-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={isAlreadyMember}
                      // Nếu đã tham gia thì luôn tích, hoặc tích theo list đang chọn
                      checked={isAlreadyMember || selectedIds.includes(user.id)}
                      onChange={() => !isAlreadyMember && toggleUser(user.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:bg-slate-300"
                    />

                    {/* Sử dụng <img> để tránh lỗi config Hostname của Next.js nếu chưa restart server */}
                    <img
                      src={
                        user.avatarUrl ||
                        `https://i.pravatar.cc/150?u=${user.id}`
                      }
                      alt={user.name}
                      className="h-9 w-9 rounded-full object-cover border border-slate-200"
                    />

                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="truncate text-sm font-medium text-slate-700">
                        {user.name}
                      </span>
                      {user.code && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {user.code}
                        </span>
                      )}
                    </div>

                    {/* Hiển thị badge nếu đã tham gia */}
                    {isAlreadyMember && (
                      <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                        Đã tham gia
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || selectedIds.length === 0}
              className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? "Đang thêm..." : "Thêm vào nhóm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
