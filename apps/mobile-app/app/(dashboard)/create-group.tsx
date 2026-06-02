import React, { useEffect } from 'react';
import CreateGroupScreen from '../../src/modules/chat/components/CreateGroupScreen';
import { useAuth } from '../../src/modules/auth/AuthProvider'; // 👈 Nhớ import useAuth của ông
import { setSharedChatConfig } from '../../src/modules/chat/axiosClient';

export default function CreateGroupRoute() {
  const { user } = useAuth(); // 👈 Lấy thông tin user đang đăng nhập

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

  // Tạo object identity để truyền xuống
  const identity = {
    email: user?.email,
    code: user?.code,
   id: (user as any)?._id || (user as any)?.id || (user as any)?.mongoId
  };

  return <CreateGroupScreen identity={identity} />; // 🚀 Truyền nó vào đây!
}