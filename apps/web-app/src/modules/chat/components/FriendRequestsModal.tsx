import React, { useEffect, useState } from "react";
import { X, Check, Trash2 } from "lucide-react";
import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../chatApi";
import { User } from "../types";

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => Promise<void> | void;
}

export const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRequests = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFriendRequests();
      setRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []); // [] có nghĩa là hàm này chỉ tạo 1 lần duy nhất

  // 2. useEffect giờ đây sẽ sạch sẽ và không bị báo lỗi nữa
  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen, loadRequests]);

  const handleAction = async (id: string, action: "accept" | "reject") => {
    if (action === "accept") await acceptFriendRequest(id);
    else await rejectFriendRequest(id);
    loadRequests(); // Tải lại danh sách sau khi bấm
    onRefresh?.(); // Cập nhật lại danh sách bạn bè ở Sidebar
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-bold text-slate-800">Lời mời kết bạn</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          {loading ? (
            <p className="text-center py-4">Đang tải...</p>
          ) : requests.length === 0 ? (
            <p className="text-center py-4 text-slate-500">
              Không có lời mời nào.
            </p>
          ) : (
            requests.map((req: User & { code?: string }) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      req.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(req.name || "U")}`
                    }
                    alt={req.name || "Avatar"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-sm">{req.name}</p>
                    <p className="text-xs text-slate-400">
                      {req.code || req.email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(req.id, "accept")}
                    className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => handleAction(req.id, "reject")}
                    className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
