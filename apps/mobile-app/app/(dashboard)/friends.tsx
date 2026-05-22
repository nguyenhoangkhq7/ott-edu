import FriendsScreen from '../../src/modules/chat/components/FriendsScreen';
import { useAuth } from '../../src/modules/auth/AuthProvider';

export default function FriendsRoute() {
  const { user } = useAuth();

  // 🚀 Tạo identity xịn để truyền xuống Props
  const identity = {
    email: user?.email,
    code: user?.code,
     id: (user as any)?._id || (user as any)?.id || (user as any)?.mongoId// Đảm bảo lấy ID 24 ký tự
  };

  return <FriendsScreen identity={identity} />;
}