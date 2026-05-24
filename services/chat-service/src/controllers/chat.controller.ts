import type { Request, Response } from "express";
import mongoose from "mongoose";
import { ChatService } from "../services/chat.service.ts";
import CallLog from "../model/CallLog.ts";
import S3Service from "../services/s3.service.ts";
import socketManager from "../socketManager.ts";
import User from "../model/User.ts";
import FriendRequest from "../model/FriendRequest.ts";
import Conversation from "../model/Conversation.ts";
import Message from "../model/Message.ts";

export class ChatController {
  // API: GET /api/calls/history
  static async getCallHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      const conversationId = typeof req.query.conversationId === "string"
        ? req.query.conversationId.trim()
        : "";
      const limitRaw = Number(req.query.limit);
      const limit = Number.isFinite(limitRaw)
        ? Math.min(Math.max(Math.floor(limitRaw), 1), 100)
        : 30;
      const pageRaw = Number(req.query.page);
      const page = Number.isFinite(pageRaw)
        ? Math.max(Math.floor(pageRaw), 1)
        : 1;
      const skip = (page - 1) * limit;

      const statusRaw = typeof req.query.status === "string"
        ? req.query.status.trim().toLowerCase()
        : "";
      const allowedStatuses = new Set([
        "ringing",
        "connected",
        "ended",
        "declined",
        "unavailable",
        "failed",
      ] as const);
      const statusValues = statusRaw
        ? statusRaw
            .split(",")
            .map((value) => value.trim())
            .filter((value): value is "ringing" | "connected" | "ended" | "declined" | "unavailable" | "failed" =>
              allowedStatuses.has(value as "ringing" | "connected" | "ended" | "declined" | "unavailable" | "failed"),
            )
        : [];

      const userObjectId = new mongoose.Types.ObjectId(userId);
      const query: {
        $or: Array<{ callerId: mongoose.Types.ObjectId } | { calleeId: mongoose.Types.ObjectId }>;
        conversationId?: mongoose.Types.ObjectId;
        status?: { $in: Array<"ringing" | "connected" | "ended" | "declined" | "unavailable" | "failed"> };
      } = {
        $or: [{ callerId: userObjectId }, { calleeId: userObjectId }],
      };

      if (conversationId) {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
          return res.status(400).json({ error: "conversationId is invalid" });
        }

        const conversation = await Conversation.findOne(
          {
            _id: conversationId,
            isArchived: { $ne: true },
            participants: userObjectId,
          },
          { type: 1 },
        ).lean();

        if (!conversation) {
          return res.status(403).json({ error: "Access denied" });
        }

        query.conversationId = new mongoose.Types.ObjectId(conversationId);

        if ((conversation as { type?: string }).type === "class") {
          delete query.$or;
        }
      }

      if (statusValues.length > 0) {
        query.status = { $in: statusValues };
      }

      const total = await CallLog.countDocuments(query as any);

      const logs = await CallLog.find(query as any)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.status(200).json({
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      });
    } catch (error: any) {
      console.error("[ChatController] getCallHistory error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error", detail: error.message });
    }
  }

  // API: GET /api/me
  static async getCurrentChatUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      const user = await User.findById(userId)
        .select("fullName avatarUrl email code role")
        .lean();
      if (!user) {
        return res.status(404).json({ error: "Chat user not found" });
      }

      return res.status(200).json({
        data: {
          ...user,
          isOnline: socketManager.isUserOnline(userId.toString()),
        },
      });
    } catch (error: any) {
      console.error("[ChatController] getCurrentChatUser error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error", detail: error.message });
    }
  }

  // API: GET /api/conversations
  static async getMyConversations(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      const type = req.query.type as string; // Lọc theo type nếu có truyền lên từ frontend

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      const conversations = await ChatService.getConversations(userId, type);
      return res.status(200).json({ data: conversations });
    } catch (error: any) {
      console.error("[ChatController] getMyConversations error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error", detail: error.message });
    }
  }

  // API: GET /api/conversations/:conversationId/role
  static async getConversationRole(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      const conversationId = req.params.conversationId as string;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      const data = await ChatService.getConversationRole(userId, conversationId);
      return res.status(200).json({ data });
    } catch (error: any) {
      console.error("[ChatController] getConversationRole error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  // API: POST /api/conversations/:conversationId/deputy
  static async setGroupDeputy(req: Request, res: Response) {
    try {
      const requesterId = (req as any).user?._id;
      const conversationId = typeof req.params.conversationId === "string" ? req.params.conversationId : "";
      const deputyId = typeof req.body?.deputyId === "string"
        ? req.body.deputyId
        : req.body?.deputyId === null
          ? null
          : undefined;

      if (!requesterId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!conversationId) {
        return res.status(400).json({ error: "conversationId is required" });
      }

      const conversation = await ChatService.setGroupDeputy(
        requesterId,
        conversationId,
        deputyId,
      );

      return res.status(200).json({ data: conversation });
    } catch (error: any) {
      console.error("[ChatController] setGroupDeputy error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  // API: GET /api/messages/:conversationId
  static async getMessagesInConversation(req: Request, res: Response) {
    try {
      const conversationId = req.params.conversationId as string;
      const requestingUserId = (req as any).user?._id?.toString();

      if (!conversationId) {
        return res.status(400).json({ error: "Missing conversationId param" });
      }

      const messages = await ChatService.getMessages(conversationId, requestingUserId);
      return res.status(200).json({ data: messages });
    } catch (error: any) {
      console.error("[ChatController] getMessagesInConversation error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error", detail: error.message });
    }
  }

  // API: GET /api/upload-url
  static async getPresignedUploadUrl(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      const { fileName, fileType } = req.query;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!fileName || !fileType) {
        return res
          .status(400)
          .json({
            error: "fileName and fileType query parameters are required",
          });
      }

      // Validate file type
      const validFileTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4", // 👈 Thêm hỗ trợ video/mp4
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "application/zip",
      ];

      if (!validFileTypes.includes(fileType as string)) {
        return res.status(400).json({ error: "Invalid file type" });
      }

      const urlData = await S3Service.generatePresignedUrl(
        fileName as string,
        fileType as string,
      );

      return res.status(200).json({ data: JSON.parse(urlData) });
    } catch (error: any) {
      console.error("[ChatController] getPresignedUploadUrl error:", error);
      return res
        .status(500)
        .json({
          error: "Failed to generate upload URL",
          detail: error.message,
        });
    }
  }

  // API: POST /api/upload-file
  static async uploadFile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      const { fileName, fileType } = req.query;
      const fileBuffer = req.body as Buffer;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!fileName || !fileType) {
        return res
          .status(400)
          .json({ error: "fileName and fileType query parameters are required" });
      }

      if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
        return res.status(400).json({ error: "File content is required" });
      }

      // Validate file size (max 20MB)
      if (fileBuffer.length > 20 * 1024 * 1024) {
        return res
          .status(400)
          .json({ error: "File too large. Maximum size is 20MB." });
      }

      // Validate file type
      const validFileTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4", // 👈 Thêm hỗ trợ video/mp4
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "application/zip",
      ];

      if (!validFileTypes.includes(fileType as string)) {
        return res.status(400).json({ error: "Invalid file type" });
      }

      const uploaded = await S3Service.uploadFile(
        fileName as string,
        fileType as string,
        fileBuffer,
      );

      return res.status(200).json({
        data: {
          ...uploaded,
        },
      });
    } catch (error: any) {
      console.error("[ChatController] uploadFile error:", error);
      return res.status(500).json({
        error: "Failed to upload file",
        detail: error.message,
      });
    }
  }

  // API: POST /api/messages
  static async sendMessage(req: Request, res: Response) {
    try {
      const senderId = (req as any).user?._id;
      // Dựa vào việc body gửi lên receiverId (private) hay conversationId (group)
      const { receiverId, conversationId, content, attachments, replyTo, isForwarded } =
        req.body;
      const normalizedContent =
        typeof content === "string" ? content.trim() : "";
      const hasAttachments =
        Array.isArray(attachments) && attachments.length > 0;

      if (!senderId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!normalizedContent && !hasAttachments) {
        return res
          .status(400)
          .json({ error: "Content or attachments is required" });
      }

      let result;
      // Nếu gửi theo conversationId -> Gửi vào nhóm (Chat Group)
      if (conversationId) {
        result = await ChatService.sendGroupMessage(
          senderId,
          conversationId,
          normalizedContent,
          attachments,
          replyTo,
          isForwarded,
        );
      }
      // Nếu gửi theo receiverId -> Gửi 1-1 (Private Chat)
      else if (receiverId) {
        result = await ChatService.sendPrivateMessage(
          senderId,
          receiverId,
          normalizedContent,
          attachments,
          replyTo,
          isForwarded,
        );
      } else {
        return res
          .status(400)
          .json({ error: "Either receiverId or conversationId is required" });
      }

      const { message, conversation } = result;

      // Phát sự kiện bằng Socket.io vào ĐÚNG room (room ID chính là conversation ID)
      socketManager.emitMessageToRoom(conversation._id.toString(), message);

      // Nếu là tin nhắn 1-1 (private), cũng emit trực tiếp cho receiverId để chắc chắn họ nhận được
      // ngay cả khi chưa join room
      if (receiverId) {
        socketManager.emitToUserTarget(receiverId, 'newMessage', message);
      }

      return res.status(201).json({ data: message });
    } catch (error: any) {
      console.error("[ChatController] sendMessage error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error", detail: error.message });
    }
  }

  // API: POST /api/conversations/group
  static async createGroup(req: Request, res: Response) {
    try {
      const creatorId = (req as any).user?._id;
      const { name, participants, avatarUrl, metadata, joinPolicy } = req.body;

      if (!creatorId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!name || !participants || !Array.isArray(participants)) {
        return res
          .status(400)
          .json({ error: "Name and participants array are required" });
      }

      const conversation = await ChatService.createGroupConversation(
        creatorId,
        name,
        participants,
        avatarUrl,
        metadata,
        joinPolicy === "approval" ? "approval" : "open",
      );

      return res.status(201).json({ data: conversation });
    } catch (error: any) {
      console.error("[ChatController] createGroup error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error", detail: error.message });
    }
  }

  // API: POST /api/conversations/:conversationId/join-policy
  static async updateJoinPolicy(req: Request, res: Response) {
    try {
      const requesterId = (req as any).user?._id;
      const conversationId = typeof req.params.conversationId === "string" ? req.params.conversationId : "";
      const joinPolicy = req.body?.joinPolicy === "approval" ? "approval" : "open";

      if (!requesterId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!conversationId) {
        return res.status(400).json({ error: "conversationId is required" });
      }

      const conversation = await ChatService.updateJoinPolicy(
        requesterId,
        conversationId,
        joinPolicy,
      );

      return res.status(200).json({ data: conversation });
    } catch (error: any) {
      console.error("[ChatController] updateJoinPolicy error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  // API: POST /api/conversations/:conversationId/members
  static async requestOrAddGroupMember(req: Request, res: Response) {
    try {
      const requesterId = (req as any).user?._id;
      const conversationId = typeof req.params.conversationId === "string" ? req.params.conversationId : "";
      const targetEmail = typeof req.body?.email === "string" ? req.body.email : undefined;
      const targetAccountId = typeof req.body?.accountId === "string" ? req.body.accountId : undefined;

      if (!requesterId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!conversationId) {
        return res.status(400).json({ error: "conversationId is required" });
      }

      const result = await ChatService.requestOrAddGroupMember(
        requesterId,
        conversationId,
        targetEmail,
        targetAccountId,
      );

      return res.status(200).json({ data: result });
    } catch (error: any) {
      console.error("[ChatController] requestOrAddGroupMember error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  // API: POST /api/conversations/:conversationId/member-requests/:requestId/approve
  static async approveGroupMemberRequest(req: Request, res: Response) {
    try {
      const requesterId = (req as any).user?._id;
      const conversationId = typeof req.params.conversationId === "string" ? req.params.conversationId : "";
      const requestId = typeof req.params.requestId === "string" ? req.params.requestId : "";

      if (!requesterId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!conversationId || !requestId) {
        return res.status(400).json({ error: "conversationId and requestId are required" });
      }

      const conversation = await ChatService.approveGroupMemberRequest(
        requesterId,
        conversationId,
        requestId,
      );

      return res.status(200).json({ data: conversation });
    } catch (error: any) {
      console.error("[ChatController] approveGroupMemberRequest error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  // API: POST /api/conversations/:conversationId/member-requests/:requestId/reject
  static async rejectGroupMemberRequest(req: Request, res: Response) {
    try {
      const requesterId = (req as any).user?._id;
      const conversationId = typeof req.params.conversationId === "string" ? req.params.conversationId : "";
      const requestId = typeof req.params.requestId === "string" ? req.params.requestId : "";

      if (!requesterId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!conversationId || !requestId) {
        return res.status(400).json({ error: "conversationId and requestId are required" });
      }

      const conversation = await ChatService.rejectGroupMemberRequest(
        requesterId,
        conversationId,
        requestId,
      );

      return res.status(200).json({ data: conversation });
    } catch (error: any) {
      console.error("[ChatController] rejectGroupMemberRequest error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  // API: POST /api/conversations/:conversationId/members/:memberId/remove
  static async removeGroupMember(req: Request, res: Response) {
    try {
      const requesterId = (req as any).user?._id;
      const conversationId = typeof req.params.conversationId === "string" ? req.params.conversationId : "";
      const memberId = typeof req.params.memberId === "string" ? req.params.memberId : "";

      if (!requesterId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!conversationId || !memberId) {
        return res.status(400).json({ error: "conversationId and memberId are required" });
      }

      const conversation = await ChatService.removeGroupMember(
        requesterId,
        conversationId,
        memberId,
      );

      return res.status(200).json({ data: conversation });
    } catch (error: any) {
      console.error("[ChatController] removeGroupMember error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  // API: POST /api/conversations/:conversationId/dissolve
  static async dissolveGroup(req: Request, res: Response) {
    try {
      const requesterId = (req as any).user?._id;
      const conversationId = typeof req.params.conversationId === "string" ? req.params.conversationId : "";

      if (!requesterId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!conversationId) {
        return res.status(400).json({ error: "conversationId is required" });
      }

      const conversation = await ChatService.dissolveGroup(requesterId, conversationId);

      return res.status(200).json({ data: conversation });
    } catch (error: any) {
      console.error("[ChatController] dissolveGroup error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  // API: POST /api/conversations/:conversationId/leave
  static async leaveGroup(req: Request, res: Response) {
    try {
      const requesterId = (req as any).user?._id;
      const conversationId = typeof req.params.conversationId === "string" ? req.params.conversationId : "";
      const newOwnerId = typeof req.body?.newOwnerId === "string" ? req.body.newOwnerId : undefined;

      if (!requesterId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!conversationId) {
        return res.status(400).json({ error: "conversationId is required" });
      }

      const conversation = await ChatService.leaveGroup(
        requesterId,
        conversationId,
        newOwnerId,
      );

      return res.status(200).json({ data: conversation });
    } catch (error: any) {
      console.error("[ChatController] leaveGroup error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  // API: POST /api/conversations/class
  static async syncClassConversation(req: Request, res: Response) {
    try {
      const { teamId, name, description, departmentId, archived, participants } =
        req.body;

      if (!teamId || !name || !Array.isArray(participants)) {
        return res.status(400).json({
          error: "teamId, name and participants array are required",
        });
      }

      const conversation = await ChatService.syncClassConversation({
        teamId: Number(teamId),
        name,
        description,
        departmentId: departmentId !== undefined ? Number(departmentId) : null,
        archived: Boolean(archived),
        participants,
      });

      return res.status(200).json({ data: conversation });
    } catch (error: any) {
      console.error("[ChatController] syncClassConversation error:", error);
      return res.status(500).json({
        error: "Internal server error",
        detail: error.message,
      });
    }
  }

  // API: POST /api/conversations/:conversationId/join
  static async joinGroup(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      const conversationId = typeof req.params.conversationId === "string" ? req.params.conversationId : "";

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!conversationId) {
        return res.status(400).json({ error: "conversationId is required" });
      }

      const result = await ChatService.joinGroup(userId, conversationId);
      return res.status(200).json({ data: result });
    } catch (error: any) {
      console.error("[ChatController] joinGroup error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  // ===================== PHẦN KẾT BẠN (SCRUM-164) =====================

  // API: GET /api/users/search?keyword=...
  static async searchUsers(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      const keyword = typeof req.query.keyword === "string" ? req.query.keyword : "";
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      // Gọi hàm searchUsers từ ChatService mà anh em mình vừa viết
      const data = await ChatService.searchUsers(keyword, userId);
      return res.status(200).json({ data });
    } catch (error: any) {
      console.error("[ChatController] searchUsers error:", error);
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  // API: GET /api/friend-requests
  static async getFriendRequests(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      // Gọi logic từ ChatService mà mình đã viết lúc nãy
      const requests = await ChatService.getFriendRequests(userId);
      return res.status(200).json({ data: requests });
    } catch (error: any) {
      console.error("[ChatController] getFriendRequests error:", error);
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  // API: POST /api/friend-requests/send
  static async sendFriendRequest(req: Request, res: Response) {
    try {
      const requesterId = (req as any).user?._id;
      const { targetId, targetEmail } = req.body;

      if (!requesterId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }
      
      if (!targetId && !targetEmail) {
        return res.status(400).json({ error: "Missing targetId or targetEmail" });
      }

      const data = await ChatService.sendFriendRequest(requesterId, targetEmail, targetId);
      return res.status(200).json({ data });
    } catch (error: any) {
      console.error("[ChatController] sendFriendRequest error:", error);
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

 // ✅ CODE CHUẨN ĐỂ FIX LỖI
static async acceptFriendRequest(req: any, res: any) {
    try {
      // 1. Lấy đúng cái chuỗi ID của người dùng (từ token đã giải mã)
      const userId = req.user._id || req.user.id; 
      
      // 2. Lấy chuỗi ID người gửi từ Frontend truyền lên
      const requesterId = req.body.requesterId;

      // 3. Truyền đúng 2 cái chuỗi ID vào Service
      const conversation = await ChatService.acceptFriendRequest(userId, requesterId); 

      return res.status(200).json({ success: true, data: conversation });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({ error: error.message });
    }
  }

  // API: POST /api/friend-requests/reject
 static async rejectFriendRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      const { requesterId } = req.body;

      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      if (!requesterId) return res.status(400).json({ error: "Thiếu requesterId" });

      await ChatService.rejectFriendRequest(userId, requesterId);
      return res.status(200).json({ success: true, message: "Đã từ chối kết bạn" });
    } catch (error: any) {
      console.error("[ChatController] rejectFriendRequest error:", error);
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
  
  // API: POST /api/socket-events/emit
  // ✨ REALTIME EVENTS ENDPOINT - Nhận sự kiện từ Core Service
  static async emitSocketEvent(req: Request, res: Response) {
    try {
      const { eventName, classId, payload } = req.body;

      if (!eventName || !classId) {
        return res.status(400).json({ error: "Thiếu eventName hoặc classId" });
      }

      // Broadcast event tới tất cả clients trong room (classId)
      socketManager.broadcastToRoom(classId, eventName, payload);

      return res.status(200).json({ success: true, message: `Event '${eventName}' broadcasted to class ${classId}` });
    } catch (error: any) {
      console.error("[ChatController] emitSocketEvent error:", error);
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  // API: GET /api/admin/stats/messages
  static async getMessageStats(req: Request, res: Response) {
    try {
      // Authenticate: Ensure only ROLE_ADMIN has access
      const rolesHeader = req.headers["x-user-roles"] || "";
      const roles = typeof rolesHeader === "string" ? rolesHeader.split(",") : [];
      if (!roles.includes("ROLE_ADMIN")) {
        return res.status(403).json({ error: "Forbidden", detail: "Bạn không có quyền thực hiện thao tác này." });
      }
      // 1. Pre-populate last 30 days
      const result: Record<string, { date: string; internal: number; external: number }> = {};
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      const formatDate = (d: Date): string => {
        const day = String(d.getDate()).padStart(2, "0");
        const month = months[d.getMonth()];
        return `${day} ${month}`;
      };

      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = formatDate(d);
        result[dateStr] = { date: dateStr, internal: 0, external: 0 };
      }

      // 2. Query MongoDB messages
      const stats = await Message.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $lookup: {
            from: "conversations",
            localField: "conversationId",
            foreignField: "_id",
            as: "conversation"
          }
        },
        {
          $unwind: "$conversation"
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              type: "$conversation.type"
            },
            count: { $sum: 1 }
          }
        }
      ]);

      // 3. Process aggregation results
      for (const item of stats) {
        const rawDateStr = item._id.date; // e.g. "2026-05-24"
        const type = item._id.type; // "class" or "private"
        
        if (rawDateStr) {
          const parts = rawDateStr.split("-");
          if (parts.length === 3) {
            const day = parts[2];
            const monthIdx = parseInt(parts[1], 10) - 1;
            const month = months[monthIdx];
            if (month) {
              const formattedDate = `${day} ${month}`; // e.g. "24 May"
              if (result[formattedDate]) {
                if (type === "class") {
                  result[formattedDate].internal += item.count;
                } else {
                  result[formattedDate].external += item.count;
                }
              }
            }
          }
        }
      }

      const finalData = Object.values(result);
      return res.status(200).json({ data: finalData });
    } catch (error: any) {
      console.error("[ChatController] getMessageStats error:", error);
      return res.status(500).json({ error: "Internal server error", detail: error.message });
    }
  }
}
