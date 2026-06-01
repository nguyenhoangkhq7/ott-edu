import type { Request, Response } from "express";
import { ConversationInfoService } from "../services/conversation-info.service.ts";

export class ConversationInfoController {
  /**
   * API: GET /api/chat/info/:conversationId
   * Lấy thông tin cơ bản của conversation (tên, avatar, thành viên)
   */
  static async getConversationInfo(req: Request, res: Response) {
    try {
      const { conversationId } = req.params as { conversationId: string };
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!conversationId) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      // Kiểm tra xem user có phải thành viên không
      const isMember = await ConversationInfoService.isUserMemberOfConversation(
        conversationId,
        userId
      );
      if (!isMember) {
        return res.status(403).json({ error: "Access denied" });
      }

      const info = await ConversationInfoService.getConversationInfo(
        conversationId
      );
      return res.status(200).json({ data: info });
    } catch (error: any) {
      console.error(
        "[ConversationInfoController] getConversationInfo error:",
        error
      );
      return res
        .status(500)
        .json({ error: "Internal server error", detail: error.message });
    }
  }

  /**
   * API: GET /api/chat/info/:conversationId/media
   * Lấy danh sách Media (Images & Videos)
   */
  static async getMediaItems(req: Request, res: Response) {
    try {
      const { conversationId } = req.params as { conversationId: string };
      const limit = Math.min(
        parseInt(req.query.limit as string) || 50,
        100
      );
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!conversationId) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      // Kiểm tra xem user có phải thành viên không
      const isMember = await ConversationInfoService.isUserMemberOfConversation(
        conversationId,
        userId
      );
      if (!isMember) {
        return res.status(403).json({ error: "Access denied" });
      }

      const media = await ConversationInfoService.getMediaItems(
        conversationId,
        limit
      );
      return res.status(200).json({ data: media });
    } catch (error: any) {
      console.error("[ConversationInfoController] getMediaItems error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error", detail: error.message });
    }
  }

  /**
   * API: GET /api/chat/info/:conversationId/files
   * Lấy danh sách Files
   */
  static async getFileItems(req: Request, res: Response) {
    try {
      const { conversationId } = req.params as { conversationId: string };
      const limit = Math.min(
        parseInt(req.query.limit as string) || 50,
        100
      );
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!conversationId) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      // Kiểm tra xem user có phải thành viên không
      const isMember = await ConversationInfoService.isUserMemberOfConversation(
        conversationId,
        userId
      );
      if (!isMember) {
        return res.status(403).json({ error: "Access denied" });
      }

      const files = await ConversationInfoService.getFileItems(
        conversationId,
        limit
      );
      return res.status(200).json({ data: files });
    } catch (error: any) {
      console.error("[ConversationInfoController] getFileItems error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error", detail: error.message });
    }
  }

  /**
   * API: GET /api/chat/info/:conversationId/links
   * Lấy danh sách Links
   */
  static async getLinkItems(req: Request, res: Response) {
    try {
      const { conversationId } = req.params as { conversationId: string };
      const limit = Math.min(
        parseInt(req.query.limit as string) || 50,
        100
      );
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!conversationId) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      // Kiểm tra xem user có phải thành viên không
      const isMember = await ConversationInfoService.isUserMemberOfConversation(
        conversationId,
        userId
      );
      if (!isMember) {
        return res.status(403).json({ error: "Access denied" });
      }

      const links = await ConversationInfoService.getLinkItems(
        conversationId,
        limit
      );
      return res.status(200).json({ data: links });
    } catch (error: any) {
      console.error("[ConversationInfoController] getLinkItems error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error", detail: error.message });
    }
  }

  /**
   * API: GET /api/chat/info/:conversationId/common-groups
   * Lấy danh sách nhóm chung (cho private chat)
   */
  static async getCommonGroups(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      if (!conversationId) {
        return res.status(400).json({ error: "Missing conversationId" });
      }

      // Kiểm tra xem user có phải thành viên không
      const isMember = await ConversationInfoService.isUserMemberOfConversation(
        conversationId as string,
        userId as string
      );
      if (!isMember) {
        return res.status(403).json({ error: "Access denied" });
      }

      const groups = await ConversationInfoService.getCommonGroups(
        conversationId as string,
        userId as string
      );
      return res.status(200).json({ data: groups });
    } catch (error: any) {
      console.error(
        "[ConversationInfoController] getCommonGroups error:",
        error
      );
      return res
        .status(500)
        .json({ error: "Internal server error", detail: error.message });
    }
  }
}
