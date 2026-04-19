import express, { Router } from "express";
import { ConversationInfoController } from "../controllers/conversation-info.controller.ts";

const router = Router();

/**
 * CONVERSATION INFO ROUTES
 * 
 * These routes handle all the conversation info sidebar features:
 * - Get conversation basic info (name, avatar, members)
 * - Get media items (images, videos)
 * - Get files with size information
 * - Get links shared in conversation
 */

// GET /api/chat/info/:conversationId
// Lấy thông tin cơ bản của conversation
router.get("/:conversationId", ConversationInfoController.getConversationInfo);

// GET /api/chat/info/:conversationId/media
// Lấy danh sách media (images, videos)
// Query: ?limit=50 (default 50, max 100)
router.get(
  "/:conversationId/media",
  ConversationInfoController.getMediaItems
);

// GET /api/chat/info/:conversationId/files
// Lấy danh sách files (non-image/video attachments)
// Query: ?limit=50 (default 50, max 100)
router.get(
  "/:conversationId/files",
  ConversationInfoController.getFileItems
);

// GET /api/chat/info/:conversationId/links
// Lấy danh sách links từ messages
// Query: ?limit=50 (default 50, max 100)
router.get(
  "/:conversationId/links",
  ConversationInfoController.getLinkItems
);

export default router;
