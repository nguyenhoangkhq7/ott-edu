import mongoose from "mongoose";
import Conversation from "../model/Conversation.ts";
import type { GroupJoinPolicy } from "../model/Conversation.ts";
import Message from "../model/Message.ts";
import User from "../model/User.ts";
import socketManager from "../socketManager.ts";

export type GroupRole = "owner" | "deputy" | "member";
import { LinkPreviewService } from "./link-preview.service.ts";

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

    if (conversation.deputyId && conversation.deputyId.toString() === userId.toString()) {
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
      const error = new Error("You do not have permission to manage this group");
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
      const error = new Error("You do not have permission to manage this group");
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

  private static getJoinPolicy(conversation: ConversationWithRole): GroupJoinPolicy {
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
    const user = await User.findById(requesterId).select("fullName email").lean();
    return user?.fullName || user?.email || "User";
  }

  private static async resolveTargetDisplayName(targetUser: any, fallbackEmail: string) {
    if (targetUser?.fullName) {
      return targetUser.fullName;
    }

    const atIndex = fallbackEmail.indexOf("@");
    return atIndex > 0 ? fallbackEmail.substring(0, atIndex) : fallbackEmail;
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

    // Formatting: trích xuất "người đang nói chuyện cùng" và xử lý trạng thái ẩn/thu hồi của lastMessage
    return conversations.map((conv: any) => {
      let otherParticipant = null;
      if (conv.type === "private") {
        otherParticipant = conv.participants.find(
          (p: any) => p._id.toString() !== userId.toString(),
        );
      }

      const participants = conv.participants.map((participant: any) => ({
        ...participant,
        isOnline: socketManager.isUserOnline(participant._id.toString()),
      }));

      if (otherParticipant) {
        otherParticipant = {
          ...otherParticipant,
          isOnline: socketManager.isUserOnline(otherParticipant._id.toString()),
        };
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
                createdAt: request.createdAt ? new Date(request.createdAt) : undefined,
              }))
            : [],
        myRole: this.resolveConversationRole(conv, userId),
        canManageGroup:
          this.resolveConversationRole(conv, userId) === "owner" ||
          this.resolveConversationRole(conv, userId) === "deputy",
        participants,
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

    // 3. Phát hiện và crawl link preview nếu có URL trong tin nhắn
    // Nếu lỗi xảy ra, vẫn lưu message bình thường (linkPreview sẽ là null)
    try {
      const linkPreview = await LinkPreviewService.processMessageForLinkPreview(content);
      if (linkPreview) {
        messagePayload.linkPreview = linkPreview;
      }
    } catch (error) {
      console.error("Error processing link preview for private message:", error);
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
  ) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.isArchived) {
      throw new Error("Conversation is archived");
    }

    if (!conversation.participants.some((participantId: ConversationParticipantId) => this.participantIdEquals(participantId, senderId))) {
      const error = new Error("You are not a member of this conversation");
      (error as any).statusCode = 403;
      throw error;
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

    // Phát hiện và crawl link preview nếu có URL trong tin nhắn
    try {
      const linkPreview = await LinkPreviewService.processMessageForLinkPreview(content);
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
  ) {
    const allParticipants = [...new Set([creatorId, ...participants])];

    const payload: any = {
      type: "class",
      name,
      participants: allParticipants,
      ownerId: creatorId,
      joinPolicy,
      pendingMemberRequests: [],
    };

    if (avatarUrl) payload.avatarUrl = avatarUrl;
    if (metadata) payload.metadata = metadata;

    const conversation = await Conversation.create(payload);

    return conversation;
  }

  static async syncClassConversation(payload: SyncClassConversationRequest) {
    const participantIds = await this.resolveParticipantIds(payload.participants);
    const firstParticipantId = participantIds[0];
    if (!firstParticipantId) {
      throw new Error("At least one participant is required for class conversation");
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
    conversation.joinPolicy = payload.joinPolicy ?? conversation.joinPolicy ?? "open";

    if (!conversation.ownerId) {
      conversation.ownerId = ownerId;
    }

    if (conversation.deputyId && !participantIds.some((participantId) => this.participantIdEquals(participantId, conversation.deputyId!.toString()))) {
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
      myRole: this.resolveConversationRole(conversation as ConversationWithRole, userId),
      canManageGroup:
        this.resolveConversationRole(conversation as ConversationWithRole, userId) === "owner" ||
        this.resolveConversationRole(conversation as ConversationWithRole, userId) === "deputy",
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

    this.ensureConversationOwner(conversation as ConversationWithRole, requesterId);

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

    const requesterRole = this.resolveConversationRole(conversation as ConversationWithRole, requesterId);
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
    const targetUser = targetAccountId
      ? await User.findById(targetAccountId).lean()
      : await this.resolveUserForEmail(targetEmail || "");

    if (!targetUser) {
      const error = new Error("Target user not found");
      (error as any).statusCode = 404;
      throw error;
    }

    const targetUserId = targetUser._id.toString();
    const normalizedEmail = (targetUser.email || targetEmail || "").trim().toLowerCase();
    if (!normalizedEmail) {
      const error = new Error("Target email is required");
      (error as any).statusCode = 400;
      throw error;
    }

    if (conversation.participants.some((participantId) => this.participantIdEquals(participantId, targetUserId))) {
      const error = new Error("User is already a member of this conversation");
      (error as any).statusCode = 409;
      throw error;
    }

    if ((conversation.pendingMemberRequests || []).some((request) => this.participantIdEquals(request.targetUserId, targetUserId))) {
      const error = new Error("There is already a pending request for this user");
      (error as any).statusCode = 409;
      throw error;
    }

    const canAddDirectly = requesterRole === "owner" || requesterRole === "deputy" || this.getJoinPolicy(conversation as ConversationWithRole) === "open";

    if (canAddDirectly) {
      conversation.participants = [...conversation.participants, new mongoose.Types.ObjectId(targetUserId)] as any;
      await conversation.save();
      return {
        conversation,
        mode: "added" as const,
      };
    }

    const targetName = await this.resolveTargetDisplayName(targetUser, normalizedEmail);
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

    this.ensureConversationManager(conversation as ConversationWithRole, requesterId);

    const request = (conversation.pendingMemberRequests || []).find(
      (item: any) => item._id?.toString() === requestId.toString(),
    );

    if (!request) {
      const error = new Error("Pending request not found");
      (error as any).statusCode = 404;
      throw error;
    }

    const targetUserId = request.targetUserId.toString();
    if (conversation.participants.some((participantId) => this.participantIdEquals(participantId, targetUserId))) {
      conversation.pendingMemberRequests = (conversation.pendingMemberRequests || []).filter(
        (item: any) => item._id?.toString() !== requestId.toString(),
      ) as any;
      await conversation.save();
      return conversation;
    }

    conversation.participants = [...conversation.participants, new mongoose.Types.ObjectId(targetUserId)] as any;
    conversation.pendingMemberRequests = (conversation.pendingMemberRequests || []).filter(
      (item: any) => item._id?.toString() !== requestId.toString(),
    ) as any;

    await conversation.save();
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

    this.ensureConversationManager(conversation as ConversationWithRole, requesterId);

    const exists = (conversation.pendingMemberRequests || []).some(
      (item: any) => item._id?.toString() === requestId.toString(),
    );

    if (!exists) {
      const error = new Error("Pending request not found");
      (error as any).statusCode = 404;
      throw error;
    }

    conversation.pendingMemberRequests = (conversation.pendingMemberRequests || []).filter(
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

    this.ensureConversationOwner(conversation as ConversationWithRole, requesterId);

    if (deputyId === undefined || deputyId === null || deputyId === "") {
      conversation.deputyId = null;
      await conversation.save();
      return conversation;
    }

    if (conversation.ownerId?.toString() === deputyId.toString()) {
      const error = new Error("Owner cannot be assigned as deputy");
      (error as any).statusCode = 400;
      throw error;
    }

    const isValidMember = conversation.participants.some(
      (participantId: ConversationParticipantId) => this.participantIdEquals(participantId, deputyId),
    );

    if (!isValidMember) {
      const error = new Error("Deputy must be an existing member of the group");
      (error as any).statusCode = 400;
      throw error;
    }

    conversation.deputyId = new mongoose.Types.ObjectId(deputyId);
    await conversation.save();
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

    this.ensureConversationManager(conversation as ConversationWithRole, requesterId);

    if (conversation.ownerId?.toString() === memberId.toString()) {
      const error = new Error("Cannot remove the owner from the group");
      (error as any).statusCode = 400;
      throw error;
    }

    if (!conversation.participants.some((participantId: ConversationParticipantId) => this.participantIdEquals(participantId, memberId))) {
      const error = new Error("Member is not part of this conversation");
      (error as any).statusCode = 404;
      throw error;
    }

    conversation.participants = conversation.participants.filter(
      (participantId: ConversationParticipantId) => !this.participantIdEquals(participantId, memberId),
    ) as any;

    if (conversation.deputyId?.toString() === memberId.toString()) {
      conversation.deputyId = null;
    }

    await conversation.save();
    return conversation;
  }

  static async dissolveGroup(requesterId: string, conversationId: string) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    this.ensureConversationOwner(conversation as ConversationWithRole, requesterId);

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

    const requesterIsOwner = conversation.ownerId?.toString() === requesterId.toString();
    const requesterIsMember = conversation.participants.some(
      (participantId: ConversationParticipantId) => this.participantIdEquals(participantId, requesterId),
    );

    if (!requesterIsMember) {
      const error = new Error("You are not a member of this conversation");
      (error as any).statusCode = 403;
      throw error;
    }

    if (requesterIsOwner) {
      if (!newOwnerId) {
        const error = new Error("You must select a new owner before leaving the group");
        (error as any).statusCode = 400;
        throw error;
      }

      const isValidNewOwner = conversation.participants.some(
        (participantId: ConversationParticipantId) => this.participantIdEquals(participantId, newOwnerId),
      );

      if (!isValidNewOwner || newOwnerId.toString() === requesterId.toString()) {
        const error = new Error("New owner must be another member of the group");
        (error as any).statusCode = 400;
        throw error;
      }

      conversation.ownerId = new mongoose.Types.ObjectId(newOwnerId);

      if (conversation.deputyId?.toString() === newOwnerId.toString()) {
        conversation.deputyId = null;
      }
    }

    conversation.participants = conversation.participants.filter(
      (participantId: ConversationParticipantId) => !this.participantIdEquals(participantId, requesterId),
    ) as any;

    if (conversation.deputyId?.toString() === requesterId.toString()) {
      conversation.deputyId = null;
    }

    if (conversation.participants.length === 0) {
      conversation.isArchived = true;
    }

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
}