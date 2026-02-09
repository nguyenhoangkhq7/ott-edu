import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import app from "./app.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// --- QUAN TRỌNG: Cấu hình để đọc file .env từ Root Project ---
// Lùi ra 2 cấp thư mục (services -> chat-service -> root)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const PORT = process.env.CHAT_PORT || 3001;

// Lấy thông tin từ biến môi trường
const MONGO_HOST = process.env.MONGO_HOST || "localhost"; // Nếu chạy Docker thì là 'mongo-db', chạy tay là 'localhost'
const MONGO_PORT = process.env.MONGO_PORT || "27017";
const MONGO_USER = process.env.MONGO_INITDB_ROOT_USERNAME;
const MONGO_PASS = process.env.MONGO_INITDB_ROOT_PASSWORD;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "chat_db";

// Tạo chuỗi kết nối
const mongoURI = `mongodb://${MONGO_USER}:${MONGO_PASS}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB_NAME}?authSource=admin`;

const startServer = async () => {
  try {
    // 1. Kết nối MongoDB
    console.log("⏳ Connecting to MongoDB...");
    console.log(`   Host: ${MONGO_HOST}`);

    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected Successfully!");

    // 2. Chạy Server
    app.listen(PORT, () => {
      console.log(`=================================`);
      console.log(`🚀 Chat Service running on Port: ${PORT}`);
      console.log(`=================================`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1); // Tắt app nếu không nối được DB
  }
};

startServer();
