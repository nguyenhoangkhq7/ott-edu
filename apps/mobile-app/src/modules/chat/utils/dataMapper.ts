// utils/dataMapper.ts
import { User } from '../types'; 

/**
 * Hàm này "làm sạch" dữ liệu User trước khi gửi lên Backend
 * Đảm bảo mọi ID đều là String và đúng định dạng MongoDB (_id)
 */
export const transformUserForApi = (user: any) => {
  return {
    ...user,
    // Ưu tiên _id, nếu không có thì lấy id, ép về chuỗi để không bị lỗi Object ID
    _id: String(user._id || user.id), 
    // Xóa id cũ nếu Backend chỉ yêu cầu _id để tránh xung đột
    id: undefined 
  };
};

/**
 * Hàm này map dữ liệu từ Backend trả về cho chuẩn với Mobile UI
 */
export const mapUserFromApi = (apiUser: any): User => {
  return {
    ...apiUser,
    id: apiUser._id || apiUser.id, // Đảm bảo luôn có id để render FlatList
  };
};