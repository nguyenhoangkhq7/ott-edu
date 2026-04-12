import express, { Router } from "express";
import { ChatController } from "../controllers/chat.controller.ts";

const router = Router();

// LƯU Ý: Những routes này nên được định nghĩa phía sau middleware auth.
// Ví dụ: app.use('/api', authMiddleware, chatRoutes)
// để đảm bảo mọi request đều có thông tin người dùng.

// Lấy danh sách hộp thoại của user hiện tại
router.get("/me", ChatController.getCurrentChatUser);

// Lấy danh sách hộp thoại của user hiện tại
router.get("/conversations", ChatController.getMyConversations);

// Lấy toàn bộ lịch sử tin nhắn của một cuộc trò chuyện
router.get(
  "/messages/:conversationId",
  ChatController.getMessagesInConversation,
);

// Lấy presigned URL để upload file trực tiếp lên S3
router.get("/upload-url", ChatController.getPresignedUploadUrl);

// Upload file qua backend để tránh CORS khi upload trực tiếp từ browser lên S3
router.post(
  "/upload-file",
  express.raw({ type: "*/*", limit: "25mb" }),
  ChatController.uploadFile,
);

// Gửi tin nhắn mới (hỗ trợ cả 1-1 và group)
router.post("/messages", ChatController.sendMessage);

// Tạo nhóm (Group Chat) mới
router.post("/conversations/group", ChatController.createGroup);

// Đồng bộ conversation của class từ core-service
router.post("/conversations/class", ChatController.syncClassConversation);

export default router;
