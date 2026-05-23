import React, { useEffect, useState } from "react";
import { User } from "../types";
import { X, Check, Trash2 } from "lucide-react";
import Image from "next/image";
import { fetchFriendRequests, acceptFriendRequest, rejectFriendRequest } from "../chatApi"; // Đường dẫn tuỳ project

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({ isOpen, onClose }) => {
  const [requests, setRequests] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRequests = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFriendRequests();
      setRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        void loadRequests();
      });
    }
  }, [isOpen, loadRequests]);

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') await acceptFriendRequest(id);
      else await rejectFriendRequest(id);
      await loadRequests();
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-bold text-slate-800">Lời mời kết bạn</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X size={20}/></button>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          {loading ? <p className="text-center text-sm text-slate-500 py-4">Đang tải...</p> : 
           requests.length === 0 ? <p className="text-center text-sm text-slate-500 py-4">Chưa có lời mời nào.</p> :
           requests.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <Image src={user.avatarUrl} alt={user.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-sm text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email || user.code}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => void handleAction(user.id, 'accept')} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"><Check size={16}/></button>
                <button onClick={() => void handleAction(user.id, 'reject')} className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};