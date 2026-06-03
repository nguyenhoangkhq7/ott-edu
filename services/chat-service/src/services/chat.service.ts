import mongoose from "mongoose";
import Conversation from "../model/Conversation.ts";
import type { GroupJoinPolicy } from "../model/Conversation.ts";
import Message from "../model/Message.ts";
import User from "../model/User.ts";
import socketManager from "../socketManager.ts";

export type GroupRole = "owner" | "deputy" | "member";
import { LinkPreviewService } from "./link-preview.service.ts";
import FriendRequest from "../model/FriendRequest.ts";

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
  ownerId?: string;
  joinPolicy?: GroupJoinPolicy;
  participants: SyncParticipant[];
};

type ConversationWithRole = any & {
  ownerId?: mongoose.Types.ObjectId | string;
  deputyId?: mongoose.Types.ObjectId | string | null;
  joinPolicy?: GroupJoinPolicy;
  pendingMemberRequests?: Array<{
    _id?: mongoose.Types.ObjectId | string;
    targetUserId: mongoose.Types.ObjectId | string;
    targetEmail: string;
    targetName: string;
    requestedById: mongoose.Types.ObjectId | string;
    requestedByName: string;
    createdAt?: Date | string;
  }>;
  myRole?: GroupRole;
  canManageGroup?: boolean;
};

type ConversationParticipantId = mongoose.Types.ObjectId | string;

export class ChatService {
  private static resolveConversationRole(
    conversation: ConversationWithRole,
    userId: string,
  ): GroupRole | null {
    if (conversation.type !== "class") return null;
    if (!conversation.ownerId || !userId) return "member";

    if (conversation.ownerId.toString() === userId.toString()) {
      return "owner";
    }

    if (
      conversation.deputyId &&
      conversation.deputyId.toString() === userId.toString()
    ) {
      return "deputy";
    }

    return "member";
  }

  private static ensureConversationOwner(
    conversation: ConversationWithRole,
    requesterId: string,
  ) {
    if (conversation.type !== "class") {
      throw new Error("Only group conversations support this action");
    }

    if (conversation.ownerId?.toString() !== requesterId.toString()) {
      const error = new Error(
        "You do not have permission to manage this group",
      );
      (error as any).statusCode = 403;
      throw error;
    }
  }

  private static ensureConversationManager(
    conversation: ConversationWithRole,
    requesterId: string,
  ) {
    const role = this.resolveConversationRole(conversation, requesterId);
    if (role !== "owner" && role !== "deputy") {
      const error = new Error(
        "You do not have permission to manage this group",
      );
      (error as any).statusCode = 403;
      throw error;
    }
  }

  private static participantIdEquals(
    participantId: ConversationParticipantId,
    otherId: string,
  ) {
    return participantId.toString() === otherId.toString();
  }

  private static getJoinPolicy(
    conversation: ConversationWithRole,
  ): GroupJoinPolicy {
    return conversation.joinPolicy === "approval" ? "approval" : "open";
  }

  private static buildPendingRequestId() {
    return new mongoose.Types.ObjectId();
  }

  private static async resolveUserForEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return null;
    }

    const user = await User.findOne({ email: normalizedEmail }).lean();
    return user;
  }

  private static async resolveRequesterDisplayName(requesterId: string) {
    const user = await User.findById(requesterId)
      .select("fullName email")
      .lean();
    return user?.fullName || user?.email || "User";
  }

  private static async resolveTargetDisplayName(
    targetUser: any,
    fallbackEmail: string,
  ) {
    if (targetUser?.fullName) {
      return targetUser.fullName;
    }

    const atIndex = fallbackEmail.indexOf("@");
    return atIndex > 0 ? fallbackEmail.substring(0, atIndex) : fallbackEmail;
  }

    // 🚀 THÊM HÀM NÀY VÀO TRONG CLASS ChatService
 private static async fetchUserFromCore(keyword: any, token?: string) { 
    try {
      const CORE_API_URL = process.env.CORE_API_URL || "http://core-service:8080";
      
      // 🚀 BÍ KÍP TRỊ LỖI: Ép mọi thứ sang chuỗi an toàn
      const safeKeyword = String(keyword || ""); 

      const url = `${CORE_API_URL}/api/users/search?keyword=${encodeURIComponent(safeKeyword)}`;
      
      console.log(`[DEBUG_INSPECTOR] 🔍 Đang gọi API: ${url} với Token: ${token ? 'CÓ' : 'KHÔNG'}`);
      
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = token;
      }

      const response = await fetch(url, { headers });
      const rawData = await response.json();

      if (!response.ok) {
          console.error(`[DEBUG_INSPECTOR] Lỗi từ Core:`, rawData);
          return null;
      }

      // In ra để xem cấu trúc thật
      console.log(`[DEBUG_INSPECTOR] Dữ liệu từ Core:`, JSON.stringify(rawData, null, 2));

      const users = Array.isArray(rawData) ? rawData : (rawData.data || rawData.content || []);
      
      // 🚀 So sánh an toàn bằng safeKeyword
      const foundUser = users.find((u: any) => 
          (u.id && u.id.toString() === safeKeyword) || 
          (u.accountId && u.accountId.toString() === safeKeyword) ||
          (u.email && u.email.toLowerCase() === safeKeyword.toLowerCase()) ||
          (u.account && u.account.email && u.account.email.toLowerCase() === safeKeyword.toLowerCase())
      );

      return foundUser;
    } catch (e) {
      console.error("[DEBUG_INSPECTOR] Lỗi kết nối:", e);
      return null;
    }
  }

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
        select: "fullName avatarUrl email code role",
      })
      .populate({
        path: "lastMessage",
        select: "content senderId createdAt isRevoked revokedFor",
      })
      .lean();

    // 1. Lấy thông tin user hiện tại để check mảng bạn bè
    const currentUser = (await User.findById(userId)
      .select("friends")
      .lean()) as any;

    return await Promise.all(
      conversations.map(async (conv: any) => {
        // 👇 BƯỚC QUAN TRỌNG NHẤT ĐÂY: NHÉT TRẠNG THÁI VÀO TỪNG PARTICIPANT 👇
        const participants = await Promise.all(
          conv.participants.map(async (participant: any) => {
            const pId = participant._id.toString();
            let friendStatus = "none";

            // Chỉ check trạng thái kết bạn với những người KHÁC BẢN THÂN MÌNH
            if (pId !== userId.toString()) {
              // Check xem đã là bạn bè chưa
              if (
                currentUser?.friends &&
                currentUser.friends.some((fId: any) => fId.toString() === pId)
              ) {
                friendStatus = "friend";
              } else {
                // Check xem 1 trong 2 người có ai gửi lời mời chưa (Check 2 chiều)
                const pendingRequest = await (FriendRequest as any)
                  .findOne({
                    $or: [
                      { requesterId: userId, recipientId: pId },
                      { requesterId: pId, recipientId: userId },
                    ],
                    status: "pending",
                  })
                  .lean();

                if (pendingRequest) {
                  friendStatus = "pending";
                }
              }
            }

            return {
              ...participant,
              isOnline: socketManager.isUserOnline(pId),
              friendStatus: friendStatus, // Đã nhét thành công vào Array cho Frontend đọc!
            };
          }),
        );
        // 👆 KẾT THÚC NHÉT TRẠNG THÁI 👆

        // Trích xuất otherParticipant cho các mục đích khác (nếu cần)
        let otherParticipant = null;
        if (conv.type === "private") {
          otherParticipant = participants.find(
            (p: any) => p._id.toString() !== userId.toString(),
          );
        }

        // Xử lý ẩn tin nhắn
        if (conv.lastMessage) {
          const isHiddenForMe =
            Array.isArray(conv.lastMessage.revokedFor) &&
            conv.lastMessage.revokedFor.some(
              (id: any) => id.toString() === userId.toString(),
            );

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
          ownerId: conv.ownerId?.toString() || null,
          deputyId: conv.deputyId?.toString() || null,
          joinPolicy: this.getJoinPolicy(conv),
          pendingMemberRequests:
            this.resolveConversationRole(conv, userId) === "owner" ||
            this.resolveConversationRole(conv, userId) === "deputy"
              ? (conv.pendingMemberRequests || []).map((request: any) => ({
                  ...request,
                  _id: request._id?.toString(),
                  targetUserId: request.targetUserId?.toString(),
                  requestedById: request.requestedById?.toString(),
                  createdAt: request.createdAt
                    ? new Date(request.createdAt)
                    : undefined,
                }))
              : [],
          myRole: this.resolveConversationRole(conv, userId),
          canManageGroup:
            this.resolveConversationRole(conv, userId) === "owner" ||
            this.resolveConversationRole(conv, userId) === "deputy",
          participants, // Array này giờ đã có friendStatus mượt mà
          otherParticipant,
        };
      }),
    );
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
      .populate({
        path: "mentions",
        select: "fullName avatarUrl email code role",
      })
      .lean();

    if (!requestingUserId) return messages;

    // Với mỗi tin nhắn, nếu requestingUserId có trong revokedFor thì đánh dấu ẩn
    return messages.map((msg: any) => {
      const isHiddenForMe =
        Array.isArray(msg.revokedFor) &&
        msg.revokedFor.some(
          (id: any) => id.toString() === requestingUserId.toString(),
        );
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
    mentions?: string[],
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
      mentions: [],
    };

    if (mentions && mentions.length > 0) {
      messagePayload.mentions = mentions.map((m: string) => new mongoose.Types.ObjectId(m));
    }

    if (attachments && attachments.length > 0) {
      messagePayload.attachments = attachments;
    }

    if (replyTo) {
      messagePayload.replyTo = replyTo;
    }

    // 3. Phát hiện và crawl link preview nếu có URL trong tin nhắn
    // Nếu lỗi xảy ra, vẫn lưu message bình thường (linkPreview sẽ là null)
    try {
      const linkPreview =
        await LinkPreviewService.processMessageForLinkPreview(content);
      if (linkPreview) {
        messagePayload.linkPreview = linkPreview;
      }
    } catch (error) {
      console.error(
        "Error processing link preview for private message:",
        error,
      );
      // Bỏ qua lỗi link preview, vẫn lưu message
    }

    // Xử lý giữ lại tính năng Forward từ nhánh develop
    if (isForwarded) {
      messagePayload.isForwarded = isForwarded;
    }

    const message = await Message.create(messagePayload);

    // Populate replyTo if it exists
    if (replyTo) {
      await message.populate("replyTo");
    }

    // Populate mentions
    if (mentions && mentions.length > 0) {
      await message.populate({
        path: "mentions",
        select: "fullName avatarUrl email code role",
      });
    }

    // 4. Cập nhật lastMessage cho parent là conversation
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
    mentions?: string[],
  ) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.isArchived) {
      throw new Error("Conversation is archived");
    }

    if (
      !conversation.participants.some(
        (participantId: ConversationParticipantId) =>
          this.participantIdEquals(participantId, senderId),
      )
    ) {
      const error = new Error("You are not a member of this conversation");
      (error as any).statusCode = 403;
      throw error;
    }

    // ✅ Kiểm tra chế độ chỉ admin được gửi tin nhắn
    if ((conversation as any).onlyAdminCanMessage) {
      const isOwner = conversation.ownerId?.toString() === senderId.toString();
      const isDeputy =
        conversation.deputyId != null &&
        conversation.deputyId.toString() === senderId.toString();
      if (!isOwner && !isDeputy) {
        const error = new Error(
          "Chỉ Trưởng nhóm và Phó nhóm mới có quyền gửi tin nhắn trong nhóm này.",
        );
        (error as any).statusCode = 403;
        throw error;
      }
    }

    const messagePayload: any = {
      conversationId: conversation._id,
      senderId,
      content,
      reactions: [],
      mentions: [],
    };

    if (mentions && mentions.length > 0) {
      messagePayload.mentions = mentions.map((m: string) => new mongoose.Types.ObjectId(m));
    }

    if (attachments && attachments.length > 0) {
      messagePayload.attachments = attachments;
    }

    if (replyTo) {
      messagePayload.replyTo = replyTo;
    }

    // Phát hiện và crawl link preview nếu có URL trong tin nhắn
    try {
      const linkPreview =
        await LinkPreviewService.processMessageForLinkPreview(content);
      if (linkPreview) {
        messagePayload.linkPreview = linkPreview;
      }
    } catch (error) {
      console.error("Error processing link preview for group message:", error);
      // Bỏ qua lỗi link preview, vẫn lưu message
    }

    // Xử lý giữ lại tính năng Forward
    if (isForwarded) {
      messagePayload.isForwarded = isForwarded;
    }

    const message = await Message.create(messagePayload);

    // Populate replyTo if it exists
    if (replyTo) {
      await message.populate("replyTo");
    }

    // Populate mentions
    if (mentions && mentions.length > 0) {
      await message.populate({
        path: "mentions",
        select: "fullName avatarUrl email code role",
      });
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
    joinPolicy: GroupJoinPolicy = "open",
    token?: string
  ) {
    const resolvedParticipantIds: string[] = [];

    // 🚀 Dùng hàm sync cho từng người trong mảng
    for (const pId of participants) {
      const user = await this.syncAndResolveUser(pId, undefined, token);
      if (user) {
        resolvedParticipantIds.push(user._id.toString());
      } else {
        const error = new Error(`Không thể đồng bộ người dùng ID ${pId} vào nhóm!`);
        (error as any).statusCode = 400;
        throw error;
      }
    }

    const allParticipants = [...new Set([creatorId.toString(), ...resolvedParticipantIds])];

    const payload: any = {
      type: "class",
      name,
      participants: allParticipants.map(id => new mongoose.Types.ObjectId(id)),
      ownerId: new mongoose.Types.ObjectId(creatorId),
      joinPolicy,
      pendingMemberRequests: [],
    };

    if (avatarUrl) payload.avatarUrl = avatarUrl;
    if (metadata) payload.metadata = metadata;

    const savedConversation = await Conversation.create(payload);

    for (const participantId of allParticipants) {
      socketManager.emitToUserTarget(
        participantId.toString(),
        "new_group_created",
        savedConversation,
      );
    }

    return savedConversation;
  }

  static async syncClassConversation(payload: SyncClassConversationRequest) {
    const participantIds = await this.resolveParticipantIds(
      payload.participants,
    );
    const firstParticipantId = participantIds[0];
    if (!firstParticipantId) {
      throw new Error(
        "At least one participant is required for class conversation",
      );
    }

    const ownerId = payload.ownerId
      ? new mongoose.Types.ObjectId(payload.ownerId)
      : firstParticipantId;
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
        ownerId,
        deputyId: null,
        joinPolicy: payload.joinPolicy ?? "open",
        pendingMemberRequests: [],
        metadata,
        isArchived: payload.archived ?? false,
      });
      return conversation;
    }

    conversation.name = payload.name;
    conversation.participants = participantIds as any;
    conversation.metadata = metadata;
    conversation.isArchived = payload.archived ?? false;
    conversation.joinPolicy =
      payload.joinPolicy ?? conversation.joinPolicy ?? "open";

    if (!conversation.ownerId) {
      conversation.ownerId = ownerId;
    }

    if (
      conversation.deputyId &&
      !participantIds.some((participantId) =>
        this.participantIdEquals(
          participantId,
          conversation.deputyId!.toString(),
        ),
      )
    ) {
      conversation.deputyId = null;
    }

    await conversation.save();
    return conversation;
  }

  static async getConversationRole(userId: string, conversationId: string) {
    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const result: {
      conversationId: string;
      ownerId: string | null;
      deputyId: string | null;
      joinPolicy: GroupJoinPolicy;
      myRole: GroupRole | null;
      canManageGroup: boolean;
    } = {
      conversationId: conversation._id.toString(),
      ownerId: conversation.ownerId?.toString() || null,
      deputyId: conversation.deputyId?.toString() || null,
      joinPolicy: this.getJoinPolicy(conversation as ConversationWithRole),
      myRole: this.resolveConversationRole(
        conversation as ConversationWithRole,
        userId,
      ),
      canManageGroup:
        this.resolveConversationRole(
          conversation as ConversationWithRole,
          userId,
        ) === "owner" ||
        this.resolveConversationRole(
          conversation as ConversationWithRole,
          userId,
        ) === "deputy",
    };

    return result;
  }

  static async updateJoinPolicy(
    requesterId: string,
    conversationId: string,
    joinPolicy: GroupJoinPolicy,
  ) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    this.ensureConversationOwner(
      conversation as ConversationWithRole,
      requesterId,
    );

    conversation.joinPolicy = joinPolicy;
    await conversation.save();
    return conversation;
  }

  static async requestOrAddGroupMember(
    requesterId: string,
    conversationId: string,
    targetEmail?: string,
    targetAccountId?: string,
  ) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.type !== "class") {
      const error = new Error("Only group conversations support this action");
      (error as any).statusCode = 400;
      throw error;
    }

    const requesterRole = this.resolveConversationRole(
      conversation as ConversationWithRole,
      requesterId,
    );
    if (!requesterRole) {
      const error = new Error("You are not a member of this conversation");
      (error as any).statusCode = 403;
      throw error;
    }

    if (!targetEmail && !targetAccountId) {
      const error = new Error("targetEmail or targetAccountId is required");
      (error as any).statusCode = 400;
      throw error;
    }

    const requesterName = await this.resolveRequesterDisplayName(requesterId);
    // --- BẮT ĐẦU ĐOẠN CẦN THAY THẾ ---

    let targetUser = targetAccountId
      ? await User.findById(targetAccountId).lean()
      : await this.resolveUserForEmail(targetEmail || "");

    // LAZY SYNC: Tự động tạo user nếu chưa có trong Mongo
    if (!targetUser && targetEmail) {
      const emailToSync = targetEmail.trim().toLowerCase();
      targetUser = await User.create({
        email: emailToSync,
        fullName: targetEmail.split("@")[0] || "Người dùng",
      });
    }

    if (!targetUser) {
      const error = new Error("Target user not found");
      (error as any).statusCode = 404;
      throw error;
    }

    // KHAI BÁO LẠI 2 BIẾN BỊ THIẾU VÀO ĐÂY NÈ:
    const targetUserId = targetUser._id.toString();
    const normalizedEmail = (targetUser.email || targetEmail || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      const error = new Error("Target email is required");
      (error as any).statusCode = 400;
      throw error;
    }

    if (
      conversation.participants.some((participantId) =>
        this.participantIdEquals(participantId, targetUserId),
      )
    ) {
      const error = new Error("User is already a member of this conversation");
      (error as any).statusCode = 409;
      throw error;
    }

    if (
      (conversation.pendingMemberRequests || []).some((request) =>
        this.participantIdEquals(request.targetUserId, targetUserId),
      )
    ) {
      const error = new Error(
        "There is already a pending request for this user",
      );
      (error as any).statusCode = 409;
      throw error;
    }

    const canAddDirectly =
      requesterRole === "owner" ||
      requesterRole === "deputy" ||
      this.getJoinPolicy(conversation as ConversationWithRole) === "open";

    if (canAddDirectly) {
      // ✨ LẤY DANH SÁCH THÀNH VIÊN CŨ TRƯỚC KHI UPDATE
      const existingMemberIds = conversation.participants.map((p: any) =>
        p.toString(),
      );

      conversation.participants = [
        ...conversation.participants,
        new mongoose.Types.ObjectId(targetUserId),
      ] as any;
      await conversation.save();

      // Phát sự kiện realtime cho các thành viên mới được thêm vào
      const membersToAdd = [targetUserId];
      for (const uId of membersToAdd) {
        socketManager.emitToUserTarget(uId.toString(), "added_to_group", {
          conversationId: conversation._id,
        });
      }

      // ✨ BÁO CHO THÀNH VIÊN CŨ CẬP NHẬT SỐ LƯỢNG (Group Updated)
      for (const existingMemberId of existingMemberIds) {
        socketManager.emitToUserTarget(existingMemberId, "group_updated", {
          conversationId: conversation._id,
        });
      }

      return {
        conversation,
        mode: "added" as const,
      };
    }
    const targetName = await this.resolveTargetDisplayName(
      targetUser,
      normalizedEmail,
    );
    const request = {
      _id: this.buildPendingRequestId(),
      targetUserId: new mongoose.Types.ObjectId(targetUserId),
      targetEmail: normalizedEmail,
      targetName,
      requestedById: new mongoose.Types.ObjectId(requesterId),
      requestedByName: requesterName,
      createdAt: new Date(),
    };

    conversation.pendingMemberRequests = [
      ...(conversation.pendingMemberRequests || []),
      request,
    ] as any;
    await conversation.save();

    return {
      conversation,
      mode: "requested" as const,
      request,
    };
  }

  static async approveGroupMemberRequest(
    requesterId: string,
    conversationId: string,
    requestId: string,
  ) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    this.ensureConversationManager(
      conversation as ConversationWithRole,
      requesterId,
    );

    const request = (conversation.pendingMemberRequests || []).find(
      (item: any) => item._id?.toString() === requestId.toString(),
    );

    if (!request) {
      const error = new Error("Pending request not found");
      (error as any).statusCode = 404;
      throw error;
    }

    const targetUserId = request.targetUserId.toString();

    // ✨ LẤY DANH SÁCH THÀNH VIÊN CŨ TRƯỚC KHI UPDATE
    const existingMemberIds = conversation.participants.map((p: any) =>
      p.toString(),
    );

    if (
      conversation.participants.some((participantId) =>
        this.participantIdEquals(participantId, targetUserId),
      )
    ) {
      conversation.pendingMemberRequests = (
        conversation.pendingMemberRequests || []
      ).filter(
        (item: any) => item._id?.toString() !== requestId.toString(),
      ) as any;
      await conversation.save();
      return conversation;
    }

    conversation.participants = [
      ...conversation.participants,
      new mongoose.Types.ObjectId(targetUserId),
    ] as any;
    conversation.pendingMemberRequests = (
      conversation.pendingMemberRequests || []
    ).filter(
      (item: any) => item._id?.toString() !== requestId.toString(),
    ) as any;

    await conversation.save();

    // Phát sự kiện realtime cho các thành viên mới được thêm vào
    const membersToAdd = [targetUserId];
    for (const uId of membersToAdd) {
      socketManager.emitToUserTarget(uId.toString(), "added_to_group", {
        conversationId: conversation._id,
      });
    }

    // ✨ BÁO CHO THÀNH VIÊN CŨ CẬP NHẬT SỐ LƯỢNG (Group Updated)
    for (const existingMemberId of existingMemberIds) {
      socketManager.emitToUserTarget(existingMemberId, "group_updated", {
        conversationId: conversation._id,
      });
    }

    return conversation;
  }
  static async rejectGroupMemberRequest(
    requesterId: string,
    conversationId: string,
    requestId: string,
  ) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    this.ensureConversationManager(
      conversation as ConversationWithRole,
      requesterId,
    );

    const exists = (conversation.pendingMemberRequests || []).some(
      (item: any) => item._id?.toString() === requestId.toString(),
    );

    if (!exists) {
      const error = new Error("Pending request not found");
      (error as any).statusCode = 404;
      throw error;
    }

    conversation.pendingMemberRequests = (
      conversation.pendingMemberRequests || []
    ).filter(
      (item: any) => item._id?.toString() !== requestId.toString(),
    ) as any;

    await conversation.save();
    return conversation;
  }

  static async setGroupDeputy(
    requesterId: string,
    conversationId: string,
    deputyId?: string | null,
  ) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    this.ensureConversationOwner(
      conversation as ConversationWithRole,
      requesterId,
    );

    if (deputyId === undefined || deputyId === null || deputyId === "") {
      conversation.deputyId = null;
      await conversation.save();

      // ✨ BÁO CHO TẤT CẢ THÀNH VIÊN CẬP NHẬT ROLE (Group Updated)
      for (const participantId of conversation.participants) {
        socketManager.emitToUserTarget(participantId.toString(), "group_updated", {
          conversationId: conversation._id,
        });
      }

      return conversation;
    }

    if (conversation.ownerId?.toString() === deputyId.toString()) {
      const error = new Error("Owner cannot be assigned as deputy");
      (error as any).statusCode = 400;
      throw error;
    }

    const isValidMember = conversation.participants.some(
      (participantId: ConversationParticipantId) =>
        this.participantIdEquals(participantId, deputyId),
    );

    if (!isValidMember) {
      const error = new Error("Deputy must be an existing member of the group");
      (error as any).statusCode = 400;
      throw error;
    }

    conversation.deputyId = new mongoose.Types.ObjectId(deputyId);
    await conversation.save();

    // ✨ BÁO CHO TẤT CẢ THÀNH VIÊN CẬP NHẬT ROLE (Group Updated)
    for (const participantId of conversation.participants) {
      socketManager.emitToUserTarget(participantId.toString(), "group_updated", {
        conversationId: conversation._id,
      });
    }

    return conversation;
  }

  static async removeGroupMember(
    requesterId: string,
    conversationId: string,
    memberId: string,
  ) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    this.ensureConversationManager(
      conversation as ConversationWithRole,
      requesterId,
    );

    if (conversation.ownerId?.toString() === memberId.toString()) {
      const error = new Error("Cannot remove the owner from the group");
      (error as any).statusCode = 400;
      throw error;
    }

    if (
      !conversation.participants.some(
        (participantId: ConversationParticipantId) =>
          this.participantIdEquals(participantId, memberId),
      )
    ) {
      const error = new Error("Member is not part of this conversation");
      (error as any).statusCode = 404;
      throw error;
    }

    conversation.participants = conversation.participants.filter(
      (participantId: ConversationParticipantId) =>
        !this.participantIdEquals(participantId, memberId),
    ) as any;

    if (conversation.deputyId?.toString() === memberId.toString()) {
      conversation.deputyId = null;
    }

    await conversation.save();

    // ✨ BÁO CHO THÀNH VIÊN BỊ XOÁ
    socketManager.emitToUserTarget(memberId.toString(), "group_updated", {
      conversationId: conversation._id,
    });

    // ✨ BÁO CHO CÁC THÀNH VIÊN CÒN LẠI
    for (const participantId of conversation.participants) {
      socketManager.emitToUserTarget(participantId.toString(), "group_updated", {
        conversationId: conversation._id,
      });
    }

    return conversation;
  }

  static async joinGroup(userId: string, conversationId: string) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      const error = new Error("Conversation not found");
      (error as any).statusCode = 404;
      throw error;
    }

    if (conversation.type !== "class") {
      const error = new Error("Only group conversations support this action");
      (error as any).statusCode = 400;
      throw error;
    }

    const isMember = conversation.participants.some((participantId) =>
      this.participantIdEquals(participantId, userId),
    );

    if (isMember) {
      return {
        conversation,
        mode: "added",
      };
    }

    const joinPolicy = this.getJoinPolicy(conversation as ConversationWithRole);

    if (joinPolicy === "open") {
      const existingMemberIds = conversation.participants.map((p: any) =>
        p.toString(),
      );

      conversation.participants = [
        ...conversation.participants,
        new mongoose.Types.ObjectId(userId),
      ] as any;
      await conversation.save();

      // Emit socket event to the joined user
      socketManager.emitToUserTarget(userId, "added_to_group", {
        conversationId: conversation._id,
      });

      // Emit to existing members
      for (const existingMemberId of existingMemberIds) {
        socketManager.emitToUserTarget(existingMemberId, "group_updated", {
          conversationId: conversation._id,
        });
      }

      return {
        conversation,
        mode: "added",
      };
    } else {
      // Policy is approval
      const isAlreadyRequested = (conversation.pendingMemberRequests || []).some(
        (request: any) => this.participantIdEquals(request.targetUserId, userId),
      );

      if (isAlreadyRequested) {
        return {
          conversation,
          mode: "requested",
        };
      }

      const user = await User.findById(userId).lean();
      if (!user) {
        const error = new Error("User not found");
        (error as any).statusCode = 404;
        throw error;
      }

      const displayName = await this.resolveRequesterDisplayName(userId);
      const email = user.email || "";

      const request = {
        _id: this.buildPendingRequestId(),
        targetUserId: new mongoose.Types.ObjectId(userId),
        targetEmail: email,
        targetName: displayName,
        requestedById: new mongoose.Types.ObjectId(userId),
        requestedByName: displayName,
        createdAt: new Date(),
      };

      conversation.pendingMemberRequests = [
        ...(conversation.pendingMemberRequests || []),
        request,
      ] as any;
      await conversation.save();

      return {
        conversation,
        mode: "requested",
        request,
      };
    }
  }

  static async dissolveGroup(requesterId: string, conversationId: string) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    this.ensureConversationOwner(
      conversation as ConversationWithRole,
      requesterId,
    );

    conversation.isArchived = true;
    await conversation.save();
    return conversation;
  }

  static async leaveGroup(
    requesterId: string,
    conversationId: string,
    newOwnerId?: string,
  ) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.type !== "class") {
      const error = new Error("Only group conversations support this action");
      (error as any).statusCode = 400;
      throw error;
    }

    const requesterIsOwner =
      conversation.ownerId?.toString() === requesterId.toString();
    const requesterIsMember = conversation.participants.some(
      (participantId: ConversationParticipantId) =>
        this.participantIdEquals(participantId, requesterId),
    );

    if (!requesterIsMember) {
      const error = new Error("You are not a member of this conversation");
      (error as any).statusCode = 403;
      throw error;
    }

    if (requesterIsOwner) {
      if (!newOwnerId) {
        const error = new Error(
          "You must select a new owner before leaving the group",
        );
        (error as any).statusCode = 400;
        throw error;
      }

      const isValidNewOwner = conversation.participants.some(
        (participantId: ConversationParticipantId) =>
          this.participantIdEquals(participantId, newOwnerId),
      );

      if (
        !isValidNewOwner ||
        newOwnerId.toString() === requesterId.toString()
      ) {
        const error = new Error(
          "New owner must be another member of the group",
        );
        (error as any).statusCode = 400;
        throw error;
      }

      conversation.ownerId = new mongoose.Types.ObjectId(newOwnerId);

      if (conversation.deputyId?.toString() === newOwnerId.toString()) {
        conversation.deputyId = null;
      }
    }

    conversation.participants = conversation.participants.filter(
      (participantId: ConversationParticipantId) =>
        !this.participantIdEquals(participantId, requesterId),
    ) as any;

    if (conversation.deputyId?.toString() === requesterId.toString()) {
      conversation.deputyId = null;
    }

    if (conversation.participants.length === 0) {
      conversation.isArchived = true;
    }

    await conversation.save();

    // ✨ BÁO CHO THÀNH VIÊN RỜI NHÓM
    socketManager.emitToUserTarget(requesterId.toString(), "group_updated", {
      conversationId: conversation._id,
    });

    // ✨ BÁO CHO CÁC THÀNH VIÊN CÒN LẠI
    for (const participantId of conversation.participants) {
      socketManager.emitToUserTarget(participantId.toString(), "group_updated", {
        conversationId: conversation._id,
      });
    }

    return conversation;
  }

  private static async resolveParticipantIds(participants: SyncParticipant[]) {
    const uniqueParticipants = new Map(
      participants
        .filter((participant) => Boolean(participant.email))
        .map(
          (participant) =>
            [participant.email.toLowerCase(), participant] as const,
        ),
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
          fullName:
            participant.fullName || participant.email.split("@")[0] || "User",
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
        if (
          participant.avatarUrl !== undefined &&
          user.avatarUrl !== participant.avatarUrl
        ) {
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

  // 1. TÌM KIẾM USER (Sửa lại URL gọi sang Core Service)
  // 1. TÌM KIẾM USER (Đã nâng cấp: Tự động Sync để lấy ID chuẩn cho Mobile)
  static async searchUsers(keyword: string, currentUserId: string, token?: string) {
    const safeKeyword = keyword ? keyword.trim() : "";

    // 🚀 Lấy danh sách bạn bè và danh sách các request pending để check friendStatus
    let friendIds = new Set<string>();
    let pendingRequestIds = new Set<string>();
    try {
      const currentUser = await User.findById(currentUserId).select("friends").lean() as any;
      if (currentUser && currentUser.friends) {
        friendIds = new Set(currentUser.friends.map((f: any) => f.toString()));
      }

      const pendingRequests = await FriendRequest.find({
        $or: [
          { requesterId: currentUserId },
          { recipientId: currentUserId }
        ],
        status: "pending"
      }).lean();

      pendingRequests.forEach((req: any) => {
        pendingRequestIds.add(req.requesterId.toString());
        pendingRequestIds.add(req.recipientId.toString());
      });
    } catch (err) {
      console.error("[ChatService] Lỗi lấy thông tin quan hệ:", err);
    }

    try {
      const CORE_API_URL = process.env.CORE_API_URL || "http://core-service:8080"; 
      
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = token;
      }

      console.log(`\n[DEBUG] Đang gọi sang Core: ${CORE_API_URL}/api/users/search?keyword=${encodeURIComponent(safeKeyword)}`);

      const response = await fetch(
        `${CORE_API_URL}/api/users/search?keyword=${encodeURIComponent(safeKeyword)}`,
        { 
          method: "GET",
          headers: headers 
        }
      );

      if (response.ok) {
        const coreData = await response.json();
        const usersFromCore = Array.isArray(coreData) ? coreData : (coreData.data || coreData.content || []);
        
        console.log(`[DEBUG] Core Service đã trả về ${usersFromCore.length} kết quả! 🎉`);
        
        // 🚀 BÍ KÍP Ở ĐÂY: Tráo đổi ID số thành ObjectId chuẩn của Mongo
        const resolvedUsers = [];
        
        for (const u of usersFromCore) {
          // Bỏ qua nếu là chính mình
          if (u.id?.toString() === currentUserId || u.accountId?.toString() === currentUserId) continue;

          // Dùng chính hàm xịn nãy giờ để sync nó vào Mongo ngay lập tức
          const targetEmail = u.email || (u.account && u.account.email) || "";
          const targetId = u.id?.toString() || u.accountId?.toString();
          
          const syncedUser = await this.syncAndResolveUser(targetId, targetEmail, token);
          
          if (syncedUser) {
            const targetMongoId = syncedUser._id.toString();
            let friendStatus = "none";
            if (friendIds.has(targetMongoId)) {
              friendStatus = "friend";
            } else if (pendingRequestIds.has(targetMongoId)) {
              friendStatus = "pending";
            }

            // Trả về cho Mobile App cái Mongo _id chuẩn 24 ký tự
            resolvedUsers.push({
              id: targetMongoId, // Đánh lừa Mobile App ở dòng này
              _id: targetMongoId,
              fullName: syncedUser.fullName,
              email: syncedUser.email,
              avatarUrl: u.avatarUrl || syncedUser.avatarUrl,
              code: u.code,
              friendStatus: friendStatus
            });
          }
        }
        
        return resolvedUsers;

      } else {
        const errorText = await response.text();
        console.error(`[ChatService] ❌ Core Service TỪ CHỐI! Mã lỗi: ${response.status}. Lý do: ${errorText}`);
      }
    } catch (error) {
      console.error("[ChatService] ❌ Lỗi sập mạng khi gọi Core:", error);
    }

    // 🔙 FALLBACK MONGODB
    console.log("Đang lấy tạm danh sách từ MongoDB...");
    const regex = new RegExp(keyword.trim(), "i");
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [{ fullName: regex }, { email: regex }, { code: regex }],
    })
      .select("fullName email avatarUrl code isOnline")
      .limit(20)
      .lean();

    return users.map((u: any) => {
      const targetMongoId = u._id.toString();
      let friendStatus = "none";
      if (friendIds.has(targetMongoId)) {
        friendStatus = "friend";
      } else if (pendingRequestIds.has(targetMongoId)) {
        friendStatus = "pending";
      }

      return {
        ...u,
        id: targetMongoId,
        fullName: u.fullName || "Người dùng",
        friendStatus: friendStatus
      };
    });
  }

  // 3. LẤY DANH SÁCH LỜI MỜI
  static async getFriendRequests(userId: string) {
    const requests = await FriendRequest.find({
      recipientId: userId,
      status: "pending",
    } as any)
      .populate("requesterId", "fullName email avatarUrl code isOnline")
      .lean();

    return requests.map((req: any) => ({
      ...req.requesterId,
      _id: req.requesterId._id.toString(),
      requestId: req._id.toString(),
    }));
  }

  // 4. CHẤP NHẬN KẾT BẠN
  static async acceptFriendRequest(userId: string, requesterId: string) {
    const request = await (FriendRequest as any).findOneAndUpdate(
      { requesterId, recipientId: userId, status: "pending" },
      { status: "accepted" },
      { new: true },
    );

    if (!request) {
      const error = new Error("Lời mời không tồn tại hoặc đã xử lý");
      (error as any).statusCode = 404;
      throw error;
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { friends: new mongoose.Types.ObjectId(requesterId) },
    });

    await User.findByIdAndUpdate(requesterId, {
      $addToSet: { friends: new mongoose.Types.ObjectId(userId) },
    });

    // Tự động tạo nhóm chat 1-1
    let conversation = await Conversation.findOne({
      type: "private",
      participants: { $all: [userId, requesterId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: "private",
        participants: [userId, requesterId],
      });
    }
console.log(`[DEBUG_SOCKET] Emit 'friend_request_accepted' tới: ${userId} và ${requesterId}`);
    // ✨ PHÁT SỰ KIỆN REALTIME CHO 2 NGƯỜI HIỆN CHAT 1-1 NGAY LẬP TỨC
    socketManager.emitToUserTarget(
      userId.toString(),
      "friend_request_accepted",
      {
        conversationId: conversation._id,
      },
    );
    socketManager.emitToUserTarget(
      requesterId.toString(),
      "friend_request_accepted",
      {
        conversationId: conversation._id,
      },
    );

    return conversation;
  }

  // 5. TỪ CHỐI KẾT BẠN
  static async rejectFriendRequest(userId: string, requesterId: string) {
    const request = await (FriendRequest as any).findOneAndUpdate(
      { requesterId, recipientId: userId, status: "pending" },
      { status: "rejected" },
      { new: true },
    );
    if (!request) {
      const error = new Error("Lời mời không tồn tại hoặc đã xử lý");
      (error as any).statusCode = 404;
      throw error;
    }
console.log(`[DEBUG_REJECT] User ${userId} từ chối ${requesterId} -> Emit 'friend_request_rejected'`);
    // ✨ PHÁT SỰ KIỆN ĐỂ UI 2 BÊN TỰ XÓA LỜI MỜI MÀ KHÔNG CẦN F5
    socketManager.emitToUserTarget(
      requesterId.toString(),
      "friend_request_rejected",
      { userId: userId.toString() },
    );
    socketManager.emitToUserTarget(
      userId.toString(),
      "friend_request_rejected",
      { requesterId: requesterId.toString() },
    );

    return { success: true };
  }

  // 6. HỦY KẾT BẠN
  static async unfriend(userId: string, targetId: string) {
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: new mongoose.Types.ObjectId(targetId) },
    });
    await User.findByIdAndUpdate(targetId, {
      $pull: { friends: new mongoose.Types.ObjectId(userId) },
    });

    // Xóa tất cả lời mời kết bạn (kể cả đã chấp nhận) giữa hai người
    await (FriendRequest as any).deleteMany({
      $or: [
        { requesterId: userId, recipientId: targetId },
        { requesterId: targetId, recipientId: userId },
      ],
    });

    // Phát sự kiện realtime cho cả hai người
    socketManager.emitToUserTarget(userId, "unfriended", { targetId });
    socketManager.emitToUserTarget(targetId, "unfriended", { userId });

    return { success: true };
  }

  // ===========================================================================
  // CẬP NHẬT CÀI ĐẶT CONVERSATION
  // ===========================================================================

  /**
   * Bật/tắt chế độ "Chỉ Admin gửi tin nhắn".
   * Chỉ owner và deputy mới có quyền gọi.
   * Tự động gửi System Message và emit WebSocket.
   */
  static async updateConversationSettings(
    requesterId: string,
    conversationId: string,
    settings: { onlyAdminCanMessage?: boolean },
  ) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      const error = new Error("Conversation not found");
      (error as any).statusCode = 404;
      throw error;
    }

    if (conversation.type !== "class") {
      const error = new Error("Only group conversations support this setting");
      (error as any).statusCode = 400;
      throw error;
    }

    // Kiểm tra quyền: chỉ owner và deputy mới được phép
    this.ensureConversationManager(
      conversation as ConversationWithRole,
      requesterId,
    );

    // Áp dụng thay đổi
    if (typeof settings.onlyAdminCanMessage !== "boolean") {
      return { conversation, systemMessage: null };
    }

    if ((conversation as any).onlyAdminCanMessage === settings.onlyAdminCanMessage) {
      return { conversation, systemMessage: null };
    }

    (conversation as any).onlyAdminCanMessage = settings.onlyAdminCanMessage;
    await conversation.save();

    // Tạo nội dung System Message
    const isEnabled = settings.onlyAdminCanMessage;
    const systemContent = isEnabled
      ? "Trưởng nhóm đã bật chế độ chỉ Quản trị viên được gửi tin nhắn."
      : "Trưởng nhóm đã tắt chế độ chỉ Quản trị viên được gửi tin nhắn.";

    // Lưu System Message vào DB
    const systemMessage = await Message.create({
      conversationId: conversation._id,
      type: "system",
      content: systemContent,
      reactions: [],
    });

    // Cập nhật lastMessage
    conversation.lastMessage = systemMessage._id as any;
    await conversation.save();

    // Emit real-time qua WebSocket đến toàn bộ thành viên trong phòng
    socketManager.emitMessageToRoom(
      conversation._id.toString(),
      systemMessage,
    );

    // Emit sự kiện cập nhật conversation để UI refresh flag onlyAdminCanMessage
    socketManager.broadcastToRoom(
      conversation._id.toString(),
      "conversation_settings_updated",
      {
        conversationId: conversation._id.toString(),
        onlyAdminCanMessage: isEnabled,
      },
    );

    return { conversation, systemMessage };
  }

  // 🚀 THÊM HÀM NÀY VÀO TRONG CLASS ChatService (src/services/chat.service.ts)
  static async sendFriendRequest(requesterId: string, targetEmail?: string, targetId?: string, token?: string) {
    // 1. Đồng bộ người nhận (Dùng cái hàm sync xịn mà ông đã fix)
    const targetUser = await this.syncAndResolveUser(targetId, targetEmail, token);
    if (!targetUser) {
        throw new Error("Không xác định được người nhận!");
    }

    const targetUserId = targetUser._id.toString();

    // 2. Kiểm tra xem đã là bạn chưa (tùy logic của ông)
    const requester = await User.findById(requesterId) as any;
    if (requester?.friends?.includes(targetUserId as any)) {
        throw new Error("Hai người đã là bạn bè rồi!");
    }

    // 3. Kiểm tra xem đã gửi lời mời chưa
    const existingRequest = await (FriendRequest as any).findOne({
        requesterId: requesterId,
        recipientId: targetUserId,
        status: "pending"
    });
    if (existingRequest) {
        throw new Error("Lời mời kết bạn đã được gửi trước đó!");
    }

    // 4. Tạo lời mời kết bạn mới
    const newRequest = await (FriendRequest as any).create({
        requesterId: requesterId,
        recipientId: targetUserId,
        status: "pending",
        createdAt: new Date()
    });

    console.log(`[DEBUG_SOCKET] Đang emit sự kiện 'new_friend_request' tới userID: ${targetUserId} (Type: ${typeof targetUserId})`);
    // 5. Emit sự kiện cho người nhận biết có lời mời mới (Realtime)
    socketManager.emitToUserTarget(targetUserId, "new_friend_request", {
        requesterId: requesterId,
        requestId: newRequest._id
    });

    // 🚀 Báo cho chính người gửi để cập nhật UI (Realtime)
    socketManager.emitToUserTarget(requesterId, "friend_status_updated", {
        targetId: targetUserId,
        status: "pending"
    });

    return newRequest;
  }
 
  // 🚀 HÀM NÀY GIẢI QUYẾT TẤT CẢ: Dù là số hay chuỗi, nó trả về User trong Mongo
 // 🚀 Thêm tham số token
  private static async syncAndResolveUser(targetId?: string, targetEmail?: string, token?: string): Promise<any> {
    console.log(`[DEBUG] Đang tìm User: ID=${targetId}, Email=${targetEmail}`);

    // 1. TÌM TRONG MONGO TRƯỚC (Bản Fix lỗi NaN)
    if (targetId) {
       const orConditions: any[] = [];

       // Nếu nó là 1 con số hợp lệ (ví dụ: "5")
       if (!isNaN(Number(targetId))) {
           orConditions.push({ id: Number(targetId) });
       }

       // Nếu nó là chuỗi 24 ký tự chuẩn của Mongo (ví dụ: "6a157f17bb...")
       if (mongoose.Types.ObjectId.isValid(targetId)) {
           orConditions.push({ _id: new mongoose.Types.ObjectId(targetId) });
       }

       // Nếu mảng có điều kiện thì mới search
       if (orConditions.length > 0) {
           const user = await User.findOne({ $or: orConditions });
           if (user) return user;
       }
    }
    
    if (targetEmail) {
       const user = await User.findOne({ email: targetEmail.toLowerCase() });
       if (user) return user;
    }

    // 2. SYNC TỪ CORE SERVICE
    const coreUser = await this.fetchUserFromCore(targetId || targetEmail || "", token);
    
    if (coreUser) {
      const email = (coreUser.email || coreUser.account?.email || "").toLowerCase();
      // Ưu tiên lấy ID từ Java trả về, nếu không có mới dùng targetId
      const id = coreUser.id || coreUser.accountId; 
      const fullName = coreUser.fullName || (coreUser.firstName ? `${coreUser.firstName} ${coreUser.lastName}` : "") || "Người dùng";
      const avatarUrl = coreUser.avatarUrl || "";

      if (!email) {
          console.error(`[SyncError] Core Service trả về user nhưng thiếu EMAIL!`);
          return null;
      }

      // 🚀 BÍ KÍP CHỐNG LỖI E11000
      let existingUser = await User.findOne({ email: email });
      if (existingUser) {
          console.log(`[DEBUG] User ${email} đã có trong Mongo, cập nhật lại ID và avatarUrl...`);
          let hasChanges = false;
          // Cập nhật ID từ Java cho nó chuẩn (Chỉ cập nhật nếu id là số)
          if (id && !isNaN(Number(id)) && (existingUser as any).id !== Number(id)) {
              (existingUser as any).id = Number(id);
              hasChanges = true;
          }
          // Cập nhật avatarUrl từ Core Service nếu khác nhau
          if (avatarUrl !== undefined && existingUser.avatarUrl !== avatarUrl) {
              existingUser.avatarUrl = avatarUrl;
              hasChanges = true;
          }
          // Cập nhật fullName nếu khác nhau
          if (fullName && existingUser.fullName !== fullName) {
              existingUser.fullName = fullName;
              hasChanges = true;
          }
          if (hasChanges) {
              await existingUser.save();
          }
          return existingUser;
      }

      console.log(`[DEBUG] Đang tạo mới user vào Mongo: ${email} với avatarUrl: ${avatarUrl}`);
      const newUser = await User.create({
        id: id && !isNaN(Number(id)) ? Number(id) : undefined, // Đảm bảo không bao giờ lưu NaN vào DB
        email: email,
        fullName: fullName,
        avatarUrl: avatarUrl,
      } as any);
      
      return newUser;
    }
    
    return null;
  }
}
