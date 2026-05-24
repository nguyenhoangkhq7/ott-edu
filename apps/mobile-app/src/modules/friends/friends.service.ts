import { Socket } from "socket.io-client";
import { ChatAuthIdentity } from "../chat/types";
import * as FriendApi from "./friends.api"; // Đảm bảo import đúng đường dẫn tới file API ông vừa gửi

// 1. ĐỊNH NGHĨA INTERFACE CHO FRIEND SERVICE
export interface FriendService {
  searchUsers: (keyword?: string) => Promise<any[]>;
  getPendingFriendRequests: () => Promise<any[]>;
  sendFriendRequest: (targetId: string) => Promise<any>;
  acceptFriendRequest: (requesterId: string) => Promise<any>;
  rejectFriendRequest: (requesterId: string) => Promise<void>;
}

// 2. TẠO FACTORY FUNCTION ĐỂ KHỞI TẠO SERVICE CÓ CHỨA SOCKET
export function getFriendService(
  socket: Socket | null,
  identity: ChatAuthIdentity
): FriendService {
  return {
    // Tìm kiếm user
    searchUsers: async (keyword: string = "") => {
      return await FriendApi.searchUsers(identity, keyword);
    },

    // Lấy danh sách đang chờ kết bạn
    getPendingFriendRequests: async () => {
      return await FriendApi.fetchFriendRequests(identity);
    },

    // Gửi lời mời kết bạn
    sendFriendRequest: async (targetId: string) => {
      const result = await FriendApi.sendFriendRequest(identity, targetId);
      
      // ⚡ REALTIME: Bắn event qua socket (nếu server của ông yêu cầu client phải tự emit)
      // Nếu Backend của ông tự động bắn event khi API thành công thì BỎ QUA dòng này
      if (socket) {
         socket.emit("send_friend_request", { targetId, sender: identity });
      }
      return result;
    },

    // Chấp nhận kết bạn
    acceptFriendRequest: async (requesterId: string) => {
      const result = await FriendApi.acceptFriendRequest(identity, requesterId);
      
      // ⚡ REALTIME: Báo cho người kia biết mình đã đồng ý
      if (socket) {
         socket.emit("accept_friend_request", { requesterId, acceptor: identity });
      }
      return result;
    },

    // Từ chối kết bạn
    rejectFriendRequest: async (requesterId: string) => {
      return await FriendApi.rejectFriendRequest(identity, requesterId);
    },
  };
}