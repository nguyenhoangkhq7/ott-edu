import { Server, Socket } from 'socket.io';

class SocketManager {
  private io: Server | null = null;
  // Lưu trữ map userId -> socketId (chỉ lưu memory, nếu app restart sẽ bị mất nhưng client tự reconnect sẽ tạo lại)
  private onlineUsers = new Map<string, string>();

  // Khởi tạo và lắng nghe các sự kiện socket (được gọi từ server.ts)
  public init(io: Server) {
    this.io = io;

    this.io.on('connection', (socket: Socket) => {
      // Giả định client gửi userId lên qua auth token hoặc query string khi socket connect
      const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;

      if (userId) {
        // Cập nhật map khi user kết nối
        this.onlineUsers.set(userId as string, socket.id);
        console.log(`User ${userId} joined with socket ${socket.id}`);
      } else {
        console.warn(`Socket connected without userId: ${socket.id}`);
      }

      // Lắng nghe sự kiện ngắt kết nối
      socket.on('disconnect', () => {
        if (userId) {
          // Xóa khỏi Map khi ngắt kết nối tránh tràn bộ nhớ và gửi nhầm
          this.onlineUsers.delete(userId as string);
          console.log(`User ${userId} disconnected`);
        }
      });
    });
  }

  // Hàm cung cấp cho Controller/Service emit tin nhắn tới 1 user cụ thể
  public emitNewMessage(receiverId: string, message: any) {
    // Lấy đúng socketId đang online thuộc về receiverId
    const receiverSocketId = this.onlineUsers.get(receiverId);

    if (receiverSocketId && this.io) {
      // Đẩy (emit) thông tin qua sự kiện 'newMessage'
      this.io.to(receiverSocketId).emit('newMessage', message);
    } else {
      // Người dùng không online, có thể xử lý push notification Firebase v.v.. ở đây
      console.log(`User ${receiverId} is offline. Message saved to DB only.`);
    }
  }
}

// Trả về dạng Singleton để các nơi khác require/import dùng chung state `onlineUsers`
export default new SocketManager();
