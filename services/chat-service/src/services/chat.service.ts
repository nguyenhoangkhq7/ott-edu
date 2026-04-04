import Conversation from "../model/Conversation.ts";
import Message from "../model/Message.ts";
import User from "../model/User.ts";

export class ChatService {
  // Lấy danh sách hộp thoại của user hiện tại
  static async getConversations(userId: string) {
    // Tìm các Conversation có chứa userId trong mảng participants
    const conversations = await Conversation.find({
      participants: { $in: [userId] },
    })
      .sort({ updatedAt: -1 }) // Sắp xếp theo thời gian hoạt động mới nhất
      .populate({
        path: "participants",
        select: "fullName avatarUrl", // Chỉ lấy thông tin tối thiểu
      })
      .populate({
        path: "lastMessage",
        select: "content senderId createdAt", // Nội dung tin nhắn cuối hiển thị ngoài List
      })
      .lean(); // lean() giúp trả về JS Object thường để thao tác dễ hơn

    // Formatting: Trích xuất trực tiếp thông tin "người đang nói chuyện cùng"
    // ra một object dễ lấy trên frontend
    return conversations.map((conv: any) => {
      // Tìm participant KHÔNG phải tài khoản đang gọi API
      const otherParticipant = conv.participants.find(
        (p: any) => p._id.toString() !== userId.toString(),
      );

      return {
        ...conv,
        otherParticipant, // Gắn vào root thuận tiện hơn thay vì duyệt mảng trên UI
      };
    });
  }

  // Lấy toàn bộ lịch sử tin nhắn của một cuộc trò chuyện
  static async getMessages(conversationId: string) {
    return await Message.find({ conversationId })
      .sort({ createdAt: 1 }) // Cũ xếp trước, mới xếp sau để UI scroll xuống
      .lean();
  }

  // Gửi tin nhắn mới 1-1
  static async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ) {
    // 1. Tìm xem giữa req.user._id (senderId) và receiverId đã có phòng chat DB chưa
    // Sử dụng toán tử $all để check mảng participants chứa đồng thời cả 2 người
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    // Nếu chưa có (người dùng nhắn tin với nhau lần đầu) thì tạo mới Conversation
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    // 2. Tạo record Message vào cơ sở dữ liệu
    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content,
    });

    // 3. Cập nhật lastMessage cho parent là conversation để UI hòm thư tự lấy msg mới
    conversation.lastMessage = message._id as any;

    // Mongoose sẽ tự update field `updatedAt` nhờ vào timestamps: true
    // Đẩy conversation đó lên top của danh sách nhắn tin
    await conversation.save();

    return { message, conversation };
  }
}
