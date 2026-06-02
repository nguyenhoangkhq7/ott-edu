import React, { useEffect } from 'react';
import FriendsScreen from '../../src/modules/chat/components/FriendsScreen';
import { useAuth } from '../../src/modules/auth/AuthProvider';
import { useSocket } from '../../src/shared/hooks/useSocket'; 
import { setSharedChatConfig } from '../../src/modules/chat/axiosClient';

export default function FriendsRoute() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0] || "User";
      setSharedChatConfig({
        email: user.email,
        code: user.code || undefined,
        fullName,
        avatarUrl: user.avatarUrl || undefined,
      });
    } else {
      setSharedChatConfig(null);
    }
  }, [user]);
  
  // 🚀 BÍ KÍP Ở ĐÂY: Ưu tiên lấy cái chuỗi dài (MongoDB ID) trước, không có mới xài số.
  // Đồng thời ÉP KIỂU SANG CHUỖI (String) để Socket nó không bị lỗi.
  const rawId = (user as any)?._id || (user as any)?.mongoId || (user as any)?.id;
  const userIdForSocket = String(rawId); 

  // Truyền cái chuỗi này vào Socket
  const socket = useSocket(userIdForSocket); 

  // Identity truyền cho màn hình
  const identity = {
    email: user?.email,
    code: user?.code,
    id: userIdForSocket 
  };

  // IN RA ĐỂ KIỂM TRA LẦN CUỐI
  console.log("🔍 [DEBUG_ROUTE] ID gửi lên Server là:", userIdForSocket, "| Kiểu:", typeof userIdForSocket);

  return <FriendsScreen identity={identity} socket={socket} />; 
}