'use client';
import dotenv from "dotenv";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const { default: app } = await import("./app.ts");
const { default: socketManager } = await import("./socketManager.ts");


const PORT = process.env.CHAT_PORT || 3001;

function buildAllowedOrigins(): string[] {
  const defaults = [
    "http://localhost:3000",
    "http://localhost:8000",
    process.env.WEB_APP_URL || "http://localhost:3000",
  ].filter(Boolean) as string[];

  const fromEnv = (process.env.APP_CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(new Set([...defaults, ...fromEnv]));
}

const allowedOrigins = buildAllowedOrigins();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

socketManager.init(io);

// 🎯 QUAN TRỌNG: Sửa lại listen để Docker container khác có thể gọi vào
// Thêm '0.0.0.0' để chấp nhận kết nối từ Core Service
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔌 Socket.IO is ready for Internal & External requests`);
});