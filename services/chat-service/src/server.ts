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

// Tạo HTTP Server từ Express app
const httpServer = createServer(app);

// Khởi tạo Socket.IO và gắn vào HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      process.env.WEB_APP_URL || "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Khởi tạo SocketManager với io instance
socketManager.init(io);

// Lắng nghe trên httpServer (không phải app.listen)
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO is ready`);
});
