import type { Request, Response } from "express";
import { ChatService } from "../services/chat.service.ts";
import socketManager from "../socketManager.ts";

export class ChatController {
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

  // API: POST /api/messages
  static async sendMessage(req: Request, res: Response) {
    try {
      const senderId = (req as any).user?._id;
      // Dựa vào việc body gửi lên receiverId (private) hay conversationId (group)
      const { receiverId, conversationId, content } = req.body;

      if (!senderId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      let result;
      // Nếu gửi theo conversationId -> Gửi vào nhóm (Chat Group)
      if (conversationId) {
        result = await ChatService.sendGroupMessage(
          senderId,
          conversationId,
          content
        );
      } 
      // Nếu gửi theo receiverId -> Gửi 1-1 (Private Chat)
      else if (receiverId) {
        result = await ChatService.sendPrivateMessage(
          senderId,
          receiverId,
          content
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
        return res.status(400).json({ error: "Name and participants array are required" });
      }

      const conversation = await ChatService.createGroupConversation(
        creatorId,
        name,
        participants,
        avatarUrl,
        metadata
      );

      return res.status(201).json({ data: conversation });
    } catch (error: any) {
      console.error("[ChatController] createGroup error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error", detail: error.message });
    }
  }
}
