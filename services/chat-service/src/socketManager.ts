import { Server, Socket } from 'socket.io';
import Conversation from './model/Conversation.ts';

class SocketManager {
  private io: Server | null = null;
  private onlineUsers = new Map<string, string>();

  public init(io: Server) {
    this.io = io;

    this.io.on('connection', async (socket: Socket) => {
      const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;

      if (userId) {
        this.onlineUsers.set(userId as string, socket.id);
        console.log(`User ${userId} joined with socket ${socket.id}`);

        // Tự động Join user vào tất cả các phòng (conversation) mà họ tham gia
        try {
          // Lấy trực tiếp từ Model Mongoose để tránh Circular Dependency với ChatService
          const conversations = await Conversation.find(
            { participants: userId },
            { _id: 1 }
          ).lean();
          
          conversations.forEach((conv) => {
            socket.join(conv._id.toString());
          });
          console.log(`User ${userId} joined ${conversations.length} conversation rooms.`);
        } catch (error) {
          console.error("Error joining rooms on connect:", error);
        }

      } else {
        console.warn(`Socket connected without userId: ${socket.id}`);
      }

      socket.on('disconnect', () => {
        if (userId) {
          this.onlineUsers.delete(userId as string);
          console.log(`User ${userId} disconnected`);
        }
      });
      
      // Cho phép client explicitly xin vào room mới khi được thêm vào nhóm (hoặc tạo hội thoại mới)
      socket.on('joinRoom', (conversationId: string) => {
        socket.join(conversationId);
        console.log(`Socket ${socket.id} joined room ${conversationId}`);
      });
    });
  }

  // Cập nhật hàm emit: giờ ta emit vào Room thay vì trỏ từng người
  // Bằng cách này gửi tin nhắn dù private (2 ng) hay group (100 ng) đều cực kỳ nhanh và chỉ 1 lệnh
  public emitMessageToRoom(conversationId: string, message: any) {
    if (this.io) {
      this.io.to(conversationId).emit('newMessage', message);
    }
  }
}

export default new SocketManager();
