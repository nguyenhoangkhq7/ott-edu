// friends.mapper.ts
import { FriendRequest, Friend } from "./types";

export const mapApiFriendRequest = (item: any): FriendRequest => {
  return {
    ...item,
    id: item._id || item.id, // 🚀 BỎ String() đi, để nguyên bản chất (số ra số, chuỗi ra chuỗi)
    _id: item._id,           
    senderId: item.senderId || item.sender?._id || item.sender?.id, // Lấy cẩn thận hơn
  };
};

export const mapApiFriend = (item: any): Friend => {
  return {
    ...item,
    id: item._id || item.id, // 🚀 BỎ String() đi
    _id: item._id,
    userId: item.userId || item._id || item.id,
  };
};