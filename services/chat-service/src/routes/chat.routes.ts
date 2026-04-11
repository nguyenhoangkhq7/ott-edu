import { Router } from "express";
import { ChatController } from "../controllers/chat.controller.ts";

const router = Router();

// LƯU Ý: Những routes này nên được định nghĩa phía sau middleware auth.
// Ví dụ: app.use('/api', authMiddleware, chatRoutes)
// để đảm bảo mọi request đều có thông tin người dùng.

// Lấy danh sách hộp thoại của user hiện tại
router.get("/conversations", ChatController.getMyConversations);

// Lấy toàn bộ lịch sử tin nhắn của một cuộc trò chuyện
router.get(
  "/messages/:conversationId",
  ChatController.getMessagesInConversation,
);

// Lấy presigned URL để upload file trực tiếp lên S3
router.get("/upload-url", ChatController.getPresignedUploadUrl);

// Gửi tin nhắn mới (hỗ trợ cả 1-1 và group)
router.post("/messages", ChatController.sendMessage);

// Tạo nhóm (Group Chat) mới
router.post("/conversations/group", ChatController.createGroup);

export default router;
