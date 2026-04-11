import Conversation from "../model/Conversation.ts";
import Message from "../model/Message.ts";
import User from "../model/User.ts";

export class ChatService {
  // Lấy danh sách hộp thoại của user hiện tại, có thể lọc theo type
  static async getConversations(userId: string, type?: string) {
    const query: any = { participants: { $in: [userId] } };
    if (type) {
      query.type = type;
    }

    const conversations = await Conversation.find(query)
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

    // Formatting: với chat private, trích xuất "người đang nói chuyện cùng" để frontend dễ dùng
    return conversations.map((conv: any) => {
      let otherParticipant = null;
      if (conv.type === "private") {
        otherParticipant = conv.participants.find(
          (p: any) => p._id.toString() !== userId.toString(),
        );
      }

      return {
        ...conv,
        otherParticipant,
      };
    });
  }

  // Lấy toàn bộ lịch sử tin nhắn của một cuộc trò chuyện
  static async getMessages(conversationId: string) {
    return await Message.find({ conversationId })
      .sort({ createdAt: 1 }) // Cũ xếp trước, mới xếp sau để UI scroll xuống
      .lean();
  }

  // Gửi tin nhắn mới 1-1 (Private)
  static async sendPrivateMessage(
    senderId: string,
    receiverId: string,
    content: string,
    attachments?: any[],
    replyTo?: string,
  ) {
    // 1. Tìm xem giữa 2 người dã có phòng chat private chưa
    let conversation = await Conversation.findOne({
      type: "private",
      participants: { $all: [senderId, receiverId] },
    });

    // Nếu chưa có thì tạo mới
    if (!conversation) {
      conversation = await Conversation.create({
        type: "private",
        participants: [senderId, receiverId],
      });
    }

    // 2. Tạo record Message vào cơ sở dữ liệu
    const messagePayload: any = {
      conversationId: conversation._id,
      senderId,
      content,
      reactions: [],
    };

    if (attachments && attachments.length > 0) {
      messagePayload.attachments = attachments;
    }

    if (replyTo) {
      messagePayload.replyTo = replyTo;
    }

    const message = await Message.create(messagePayload);

    // Populate replyTo if it exists
    if (replyTo) {
      await message.populate("replyTo");
    }

    // 3. Cập nhật lastMessage cho parent là conversation
    conversation.lastMessage = message._id as any;
    await conversation.save();

    return { message, conversation };
  }

  // Gửi tin nhắn vào một nhóm có sẵn (Class)
  static async sendGroupMessage(
    senderId: string,
    conversationId: string,
    content: string,
    attachments?: any[],
    replyTo?: string,
  ) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const messagePayload: any = {
      conversationId: conversation._id,
      senderId,
      content,
      reactions: [],
    };

    if (attachments && attachments.length > 0) {
      messagePayload.attachments = attachments;
    }

    if (replyTo) {
      messagePayload.replyTo = replyTo;
    }

    const message = await Message.create(messagePayload);

    // Populate replyTo if it exists
    if (replyTo) {
      await message.populate("replyTo");
    }

    conversation.lastMessage = message._id as any;
    await conversation.save();

    return { message, conversation };
  }

  // Tạo mới một nhóm lớp (Group Chat)
  static async createGroupConversation(
    creatorId: string,
    name: string,
    participants: string[],
    avatarUrl?: string,
    metadata?: any,
  ) {
    const allParticipants = [...new Set([creatorId, ...participants])];

    const payload: any = {
      type: "class",
      name,
      participants: allParticipants,
    };

    if (avatarUrl) payload.avatarUrl = avatarUrl;
    if (metadata) payload.metadata = metadata;

    const conversation = await Conversation.create(payload);

    return conversation;
  }
}
