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

// Gửi tin nhắn mới tới người dùng khác
router.post("/messages", ChatController.sendMessage);

export default router;
