import mongoose from "mongoose";
import Conversation from "../model/Conversation.ts";
import Message from "../model/Message.ts";
import User from "../model/User.ts";
import { mysqlPool } from '../config/mysql.ts';

type SyncParticipant = {
  accountId?: number;
  email: string;
  fullName: string;
  code?: string;
  avatarUrl?: string;
};

type SyncClassConversationRequest = {
  teamId: number;
  name: string;
  description?: string | null;
  departmentId?: number | null;
  archived?: boolean;
  participants: SyncParticipant[];
};

export class ChatService {
  // Lấy danh sách hộp thoại của user hiện tại, có thể lọc theo type
  static async getConversations(userId: string, type?: string) {
    const query: any = {
      participants: { $in: [userId] },
      isArchived: { $ne: true },
    };
    if (type) {
      query.type = type;
    }

    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .populate({
        path: "participants",
        select: "fullName avatarUrl email code",
      })
      .populate({
        path: "lastMessage",
        select: "content senderId createdAt isRevoked revokedFor",
      })
      .lean();

    // Formatting: trích xuất "người đang nói chuyện cùng" và xử lý trạng thái ẩn/thu hồi của lastMessage
    return conversations.map((conv: any) => {
      let otherParticipant = null;
      if (conv.type === "private") {
        otherParticipant = conv.participants.find(
          (p: any) => p._id.toString() !== userId.toString(),
        );
      }

      if (conv.lastMessage) {
        const isHiddenForMe = Array.isArray(conv.lastMessage.revokedFor) &&
          conv.lastMessage.revokedFor.some((id: any) => id.toString() === userId.toString());
        
        if (isHiddenForMe) {
          conv.lastMessage = {
            ...conv.lastMessage,
            content: "",
            isRevoked: false,
            _hiddenForMe: true, // Marker Frontend
          };
        }
      }

      return {
        ...conv,
        otherParticipant,
      };
    });
  }

  // Lấy toàn bộ lịch sử tin nhắn của một cuộc trò chuyện
  // requestingUserId: để lọc tin nhắn đã bị ẩn bởi user đó (revokedFor)
  static async getMessages(conversationId: string, requestingUserId?: string) {
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate({
        path: "replyTo",
        select: "content senderId isRevoked revokedFor attachments",
      })
      .lean();

    if (!requestingUserId) return messages;

    // Với mỗi tin nhắn, nếu requestingUserId có trong revokedFor thì đánh dấu ẩn
    return messages.map((msg: any) => {
      const isHiddenForMe = Array.isArray(msg.revokedFor) &&
        msg.revokedFor.some((id: any) => id.toString() === requestingUserId.toString());
      if (isHiddenForMe) {
        // Trả về dạng "đã ẩn" chỉ cho user này
        return {
          ...msg,
          content: "",
          attachments: [],
          isRevoked: false,
          _hiddenForMe: true, // Frontend dùng field này để render "Bạn đã ẩn tin nhắn này"
        };
      }
      return msg;
    });
  }

  // Gửi tin nhắn mới 1-1 (Private)
  static async sendPrivateMessage(
    senderId: string,
    receiverId: string,
    content: string,
    attachments?: any[],
    replyTo?: string,
    isForwarded?: boolean,
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

    if (isForwarded) {
      messagePayload.isForwarded = isForwarded;
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
    isForwarded?: boolean,
  ) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.isArchived) {
      throw new Error("Conversation is archived");
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

    if (isForwarded) {
      messagePayload.isForwarded = isForwarded;
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

  // [Hậu] Tạo mới một nhóm lớp (Group Chat)
  static async createGroupConversation(
    creatorId: string, name: string, participants: string[], avatarUrl?: string, metadata?: any, type: "class" | "group" = "group"
  ) {
    console.log(`🕵️ [DEBUG Tạo nhóm] creatorId: ${creatorId} | name: ${name} | participants:`, participants);
    const allNumericIds = [...new Set([creatorId, ...participants])];
    
    const mongoIds = await Promise.all(
      allNumericIds.map(async (id) => {
        const mysqlUser = await this.getMysqlUserById(id);
        // ⚠️ Tương tự: Nếu có thì map, không thì dùng nguyên gốc
        return mysqlUser ? await this.ensureMongoUser(mysqlUser) : id;
      })
    );

    // ⚠️ Lọc sạch những ông bị 'null' để Mongo không báo lỗi
    const validMongoIds = mongoIds.filter(id => id !== null && id !== undefined);

    const payload: any = {
      type: type,
      name,
      participants: validMongoIds,
    };

    if (avatarUrl) payload.avatarUrl = avatarUrl;
    if (metadata) payload.metadata = metadata;

    return await Conversation.create(payload);
  }

  static async syncClassConversation(payload: SyncClassConversationRequest) {
    const participantIds = await this.resolveParticipantIds(payload.participants);
    const metadata = {
      teamId: payload.teamId,
      description: payload.description ?? null,
      departmentId: payload.departmentId ?? null,
    };

    let conversation = await Conversation.findOne({
      teamId: payload.teamId,
      type: "class",
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: "class",
        teamId: payload.teamId,
        name: payload.name,
        participants: participantIds,
        metadata,
        isArchived: payload.archived ?? false,
      });
      return conversation;
    }

    conversation.name = payload.name;
    conversation.participants = participantIds as any;
    conversation.metadata = metadata;
    conversation.isArchived = payload.archived ?? false;

    await conversation.save();
    return conversation;
  }

  private static async resolveParticipantIds(participants: SyncParticipant[]) {
    const uniqueParticipants = new Map(
      participants
        .filter((participant) => Boolean(participant.email))
        .map((participant) => [participant.email.toLowerCase(), participant] as const),
    );

    const resolvedUserIds: mongoose.Types.ObjectId[] = [];

    for (const participant of uniqueParticipants.values()) {
      let user = await User.findOne({ email: participant.email.toLowerCase() });
      if (!user) {
        const newUser: {
          email: string;
          fullName: string;
          code?: string;
          avatarUrl?: string;
        } = {
          email: participant.email.toLowerCase(),
          fullName: participant.fullName || participant.email.split("@")[0] || "User",
        };

        if (participant.code !== undefined) {
          newUser.code = participant.code;
        }

        if (participant.avatarUrl !== undefined) {
          newUser.avatarUrl = participant.avatarUrl;
        }

        user = await User.create(newUser);
      } else {
        let hasChanges = false;
        if (participant.fullName && user.fullName !== participant.fullName) {
          user.fullName = participant.fullName;
          hasChanges = true;
        }
        if (participant.code !== undefined && user.code !== participant.code) {
          user.code = participant.code;
          hasChanges = true;
        }
        if (participant.avatarUrl !== undefined && user.avatarUrl !== participant.avatarUrl) {
          user.avatarUrl = participant.avatarUrl;
          hasChanges = true;
        }

        if (hasChanges) {
          await user.save();
        }
      }

      resolvedUserIds.push(user._id);
    }

    return resolvedUserIds;
  }
  // [Hậu] [SCRUM-164]: Gửi lời mời kết bạn
  static async sendFriendRequest(senderId: string, receiverId: string) {
    console.log(`🕵️ [DEBUG Kết bạn] Người gửi (senderId): ${senderId} | Người nhận (receiverId): ${receiverId}`);
    if (senderId === receiverId) throw new Error("Không thể tự kết bạn với chính mình");
    
    const sUser = await this.getMysqlUserById(senderId);
    const rUser = await this.getMysqlUserById(receiverId);
    
    // ⚠️ CHỐT CHẶN QUAN TRỌNG: Nếu không thấy trong MySQL (do là ObjectId) thì giữ nguyên ID cũ
    const sMongoId = sUser ? await this.ensureMongoUser(sUser) : senderId;
    const rMongoId = rUser ? await this.ensureMongoUser(rUser) : receiverId;

    if (!sMongoId || !rMongoId) throw new Error("Không tìm thấy người dùng trên hệ thống");

    const updatedUser = await User.findByIdAndUpdate(
      rMongoId,
      { $addToSet: { friendRequests: sMongoId } }, 
      { new: true }
    );
    return updatedUser;
  }

  // [SCRUM-164]: Chấp nhận kết bạn
  static async acceptFriendRequest(userId: string, senderId: string) {
    await User.findByIdAndUpdate(userId, {
      $pull: { friendRequests: senderId },
      $addToSet: { friends: senderId }
    });

    await User.findByIdAndUpdate(senderId, {
      $addToSet: { friends: userId }
    });

    return { success: true, message: "Đã trở thành bạn bè" };
  }

  // [SCRUM-165]: Thêm thành viên vào nhóm
  static async addMembersToGroup(conversationId: string, newMemberIds: string[]) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error("Không tìm thấy cuộc hội thoại");

    // Đổi list ID số sang ObjectId
    const mongoMemberIds = await Promise.all(
      newMemberIds.map(async (id) => {
        const mysqlUser = await this.getMysqlUserById(id);
        return await this.ensureMongoUser(mysqlUser);
      })
    );

    const updatedGroup = await Conversation.findByIdAndUpdate(
      conversationId,
      { $addToSet: { participants: { $each: mongoMemberIds } } },
      { new: true }
    ).populate('participants', 'fullName email avatarUrl');

    return updatedGroup;
  }
 static async getAllUsers() {
    try {
      // Câu query JOIN 2 bảng và đổi tên cột cho khớp với Frontend
      const query = `
        SELECT 
          a.id AS _id, 
          a.email, 
          CONCAT_WS(' ', p.last_name, p.first_name) AS fullName, 
          p.code, 
          p.avatar_url AS avatarUrl 
        FROM accounts a
        LEFT JOIN profiles p ON a.id = p.account_id
      `;

      const [rows] = await mysqlPool.execute(query);
      
      console.log("🔥 Đã lấy thành công từ MySQL:", (rows as any[]).length, "người");
      return rows;
    } catch (error) {
      console.error("Lỗi khi query MySQL:", error);
      return [];
    }
  }

  // Thêm vào cuối class ChatService
// Hỗ trợ đồng bộ User MySQL -> MongoDB (Dựa trên accountId)
  static async ensureMongoUser(mysqlUser: any) {
    if (!mysqlUser) return null;

    // 1. Tìm bằng accountId (ID gốc từ MySQL)
    let mongoUser = await User.findOne({ accountId: mysqlUser.id });

    // 2. Nếu chưa có accountId, thử tìm bằng email (cho các user cũ đã có trong Mongo)
    if (!mongoUser) {
      mongoUser = await User.findOne({ email: mysqlUser.email.toLowerCase() });
    }

    // 3. Nếu chưa có "hộ khẩu" bên Mongo thì tạo mới
    if (!mongoUser) {
      mongoUser = await User.create({
        accountId: mysqlUser.id,
        email: mysqlUser.email.toLowerCase(),
        fullName: mysqlUser.fullName || 'User MySQL',
        code: mysqlUser.code,
        role: 'student',
        avatarUrl: mysqlUser.avatarUrl || 'https://via.placeholder.com/150'
      });
      console.log(`✅ Đã ánh xạ User MySQL ID ${mysqlUser.id} sang MongoDB`);
    } else if (!mongoUser.accountId) {
      // Nếu có email rồi nhưng chưa có accountId thì cập nhật luôn cho đồng bộ
      mongoUser.accountId = mysqlUser.id;
      await mongoUser.save();
    }

    return mongoUser._id;
  }

 private static async getMysqlUserById(id: string | number) {
    // Nếu ID truyền vào đã là ObjectId (chuỗi 24 ký tự) thì không cần tìm trong MySQL
    if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) return null;

    const [rows]: any = await mysqlPool.execute(
      `SELECT a.id, a.email, CONCAT_WS(' ', p.last_name, p.first_name) AS fullName, p.code, p.avatar_url AS avatarUrl 
       FROM accounts a LEFT JOIN profiles p ON a.id = p.account_id WHERE a.id = ?`,
      [id]
    );
    return rows[0];
  }
}
