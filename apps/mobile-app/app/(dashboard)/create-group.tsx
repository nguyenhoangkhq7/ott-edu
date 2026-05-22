import CreateGroupScreen from '../../src/modules/chat/components/CreateGroupScreen';
import { useAuth } from '../../src/modules/auth/AuthProvider'; // 👈 Nhớ import useAuth của ông

export default function CreateGroupRoute() {
  const { user } = useAuth(); // 👈 Lấy thông tin user đang đăng nhập

  // Tạo object identity để truyền xuống
  const identity = {
    email: user?.email,
    code: user?.code,
   id: (user as any)?._id || (user as any)?.id || (user as any)?.mongoId
  };

  return <CreateGroupScreen identity={identity} />; // 🚀 Truyền nó vào đây!
}