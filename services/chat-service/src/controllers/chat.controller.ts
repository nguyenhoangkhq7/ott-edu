import type { Request, Response } from "express";
import mongoose from "mongoose";
import { ChatService } from "../services/chat.service.ts";
import CallLog from "../model/CallLog.ts";
import S3Service from "../services/s3.service.ts";
import socketManager from "../socketManager.ts";
import User from "../model/User.ts";

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
        query.conversationId = new mongoose.Types.ObjectId(conversationId);
      }

      if (statusValues.length > 0) {
        query.status = { $in: statusValues };
      }

      const total = await CallLog.countDocuments(query);

      const logs = await CallLog.find(query)
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
        .select("fullName avatarUrl email code")
        .lean();
      if (!user) {
        return res.status(404).json({ error: "Chat user not found" });
      }

      return res.status(200).json({ data: user });
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

  // API: GET /api/messages/:conversationId
  static async getMessagesInConversation(req: Request, res: Response) {
    try {
      const conversationId = req.params.conversationId as string;

      if (!conversationId) {
        return res.status(400).json({ error: "Missing conversationId param" });
      }

      const messages = await ChatService.getMessages(conversationId);
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
      const { receiverId, conversationId, content, attachments, replyTo } =
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
        );
      } else {
        return res
          .status(400)
          .json({ error: "Either receiverId or conversationId is required" });
      }

      const { message, conversation } = result;

      // Phát sự kiện bằng Socket.io vào ĐÚNG room (room ID chính là conversation ID)
      socketManager.emitMessageToRoom(conversation._id.toString(), message);

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
      const { name, participants, avatarUrl, metadata } = req.body;

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
      );

      return res.status(201).json({ data: conversation });
    } catch (error: any) {
      console.error("[ChatController] createGroup error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error", detail: error.message });
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
}
