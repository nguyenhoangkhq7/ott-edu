import type { Request, Response } from "express";
import { ChatService } from "../services/chat.service.ts";
import socketManager from "../socketManager.ts";

export class ChatController {
  // API: GET /api/conversations
  static async getMyConversations(req: Request, res: Response) {
    try {
      console.log(req.headers);
      // Lấy id từ middleware xác thực (Giả định req.user được gán bởi middleware token)
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      // lấy tất cả conver của user
      const conversations = await ChatService.getConversations(userId);
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

      // Lấy tất cả tin nhắn trong conversation
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
      const { receiverId, content } = req.body;

      // Validate dữ liệu yêu cầu
      if (!senderId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!receiverId || !content) {
        return res
          .status(400)
          .json({ error: "Receiver ID and content are required" });
      }

      // Lưu tin nhắn vào DataBase
      const { message } = await ChatService.sendMessage(
        senderId,
        receiverId,
        content,
      );

      // BẮT BUỘC: Real-time update - Nếu lưu DB thành công lập tức bắn sự kiện qua socket.io
      // cho người nhận dựa trên receiverId
      socketManager.emitNewMessage(receiverId, message);

      return res.status(201).json({ data: message });
    } catch (error: any) {
      console.error("[ChatController] sendMessage error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error", detail: error.message });
    }
  }
}
