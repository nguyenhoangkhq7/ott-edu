import mongoose from "mongoose";

// LƯU Ý: Tùy thuộc vào cấu hình tsconfig.json (đặc biệt là moduleResolution),
// nếu báo lỗi import, bạn có thể cần thêm đuôi .js (ví dụ: './models/User.js')
import User from "./src/model/User.ts";
import Conversation from "./src/model/Conversation.ts";
import Message from "./src/model/Message.ts";

// TODO: Điền chuỗi kết nối MongoDB của bạn vào đây
// Thử lấy từ biến môi trường (Docker Compose thường set cái này), nếu không có thì dùng tên service mongo-db
const MONGO_URI: string =
  "mongodb://root:secret_mongo_pass@mongo-db:27017/ott_edu_db?authSource=admin";

const seedData = async (): Promise<void> => {
  try {
    console.log("⏳ Đang kết nối tới database...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Đã kết nối MongoDB!");

    // 1. Tạo 2 User
    console.log("⏳ Đang tạo users...");
    const student = await User.create({
      email: "sinhvien@edu.vn",
      fullName: "Nguyễn Văn A",
      avatarUrl: "https://via.placeholder.com/150",
      role: "student",
    });

    const teacher = await User.create({
      email: "giangvien@edu.vn",
      fullName: "Trần Văn B",
      avatarUrl: "https://via.placeholder.com/150",
      role: "teacher",
    });
    console.log("✅ Đã tạo xong User!");

    // 2. Tạo một Conversation giữa 2 user
    console.log("⏳ Đang tạo cuộc trò chuyện...");
    const conversation = await Conversation.create({
      participants: [student._id, teacher._id],
    });
    console.log("✅ Đã tạo xong Conversation!");

    // 3. Tạo Tin nhắn giả lập
    console.log("⏳ Đang tạo tin nhắn...");
    const msg1 = await Message.create({
      conversationId: conversation._id,
      senderId: student._id,
      content:
        "Dạ thầy ơi, em muốn hỏi một chút về phần thiết kế kiến trúc Backend với Node.js ạ.",
    });

    const msg2 = await Message.create({
      conversationId: conversation._id,
      senderId: teacher._id,
      content:
        "Chào em, em đang vướng mắc ở phần chia Controller và Service hay ở phần cấu trúc Database?",
    });

    // 4. Cập nhật lastMessage cho Conversation
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: msg2._id,
    });
    console.log("✅ Đã tạo xong Tin nhắn!");

    // In ra ID để test
    console.log("\n🎉 THÀNH CÔNG! HÃY COPY CÁC ID DƯỚI ĐÂY ĐỂ TEST:");
    console.log("--------------------------------------------------");
    console.log(`🆔 ID Sinh viên (User A) : ${student._id}`);
    console.log(`🆔 ID Giảng viên (User B): ${teacher._id}`);
    console.log(`🆔 ID Đoạn chat        : ${conversation._id}`);
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("❌ Lỗi khi chạy seed:", error);
  } finally {
    // Chạy xong thì ngắt kết nối
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối database.");
  }
};

// Thực thi hàm
seedData();
