import { Server, Socket } from "socket.io";
import Conversation from "./model/Conversation.ts";
import Message from "./model/Message.ts";

class SocketManager {
  private io: Server | null = null;
  private onlineUsers = new Map<string, string>();

  public init(io: Server) {
    this.io = io;

    this.io.on("connection", async (socket: Socket) => {
      const userId =
        socket.handshake.auth?.userId || socket.handshake.query?.userId;

      if (userId) {
        this.onlineUsers.set(userId as string, socket.id);
        console.log(`User ${userId} joined with socket ${socket.id}`);

        // Tự động Join user vào tất cả các phòng (conversation) mà họ tham gia
        try {
          // Lấy trực tiếp từ Model Mongoose để tránh Circular Dependency với ChatService
          const conversations = await Conversation.find(
            { participants: userId },
            { _id: 1 },
          ).lean();

          conversations.forEach((conv) => {
            socket.join(conv._id.toString());
          });
          console.log(
            `User ${userId} joined ${conversations.length} conversation rooms.`,
          );
        } catch (error) {
          console.error("Error joining rooms on connect:", error);
        }
      } else {
        console.warn(`Socket connected without userId: ${socket.id}`);
      }

      socket.on("disconnect", () => {
        if (userId) {
          this.onlineUsers.delete(userId as string);
          console.log(`User ${userId} disconnected`);
        }
      });

      // Cho phép client explicitly xin vào room mới khi được thêm vào nhóm (hoặc tạo hội thoại mới)
      socket.on("joinRoom", (conversationId: string) => {
        socket.join(conversationId);
        console.log(`Socket ${socket.id} joined room ${conversationId}`);
      });

      // Handle message reactions
      socket.on(
        "reactMessage",
        async (data: {
          messageId: string;
          conversationId: string;
          emoji: string;
        }) => {
          try {
            const { messageId, conversationId, emoji } = data;

            if (!messageId || !conversationId || !emoji || !userId) {
              console.warn("Invalid reaction data:", data);
              return;
            }

            // Update message with reaction
            const message = await Message.findById(messageId);
            if (!message) {
              console.warn("Message not found:", messageId);
              return;
            }

            // Check if user already reacted with this emoji
            const existingReactionIndex = message.reactions.findIndex(
              (r: any) =>
                r.userId.toString() === userId.toString() && r.emoji === emoji,
            );

            if (existingReactionIndex !== -1) {
              // Remove reaction if it already exists
              message.reactions.splice(existingReactionIndex, 1);
            } else {
              // Add new reaction
              message.reactions.push({
                userId,
                emoji,
              });
            }

            await message.save();

            // Emit updated message to all clients in the room
            this.io?.to(conversationId).emit("messageReacted", {
              messageId,
              reactions: message.reactions,
            });
          } catch (error) {
            console.error("Error handling reaction:", error);
          }
        },
      );

      // Handle message revocation
      socket.on(
        "revokeMessage",
        async (data: { messageId: string; conversationId: string }) => {
          try {
            const { messageId, conversationId } = data;

            if (!messageId || !conversationId || !userId) {
              console.warn("Invalid revoke data:", data);
              return;
            }

            // Update message as revoked
            const message = await Message.findByIdAndUpdate(
              messageId,
              { isRevoked: true },
              { new: true },
            );

            if (!message) {
              console.warn("Message not found:", messageId);
              return;
            }

            // Emit revocation event to all clients in the room
            this.io?.to(conversationId).emit("messageRevoked", {
              messageId,
              isRevoked: true,
            });
          } catch (error) {
            console.error("Error handling message revocation:", error);
          }
        },
      );
    });
  }

  // Cập nhật hàm emit: giờ ta emit vào Room thay vì trỏ từng người
  // Bằng cách này gửi tin nhắn dù private (2 ng) hay group (100 ng) đều cực kỳ nhanh và chỉ 1 lệnh
  public emitMessageToRoom(conversationId: string, message: any) {
    if (this.io) {
      // Serialize Mongoose document thành plain object để đảm bảo tất cả fields (including linkPreview) được emit
      const plainMessage = message.toObject
        ? message.toObject()
        : JSON.parse(JSON.stringify(message));
      this.io.to(conversationId).emit("newMessage", plainMessage);
    }
  }
}

export default new SocketManager();
