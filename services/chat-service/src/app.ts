import express, { type Request, type Response } from "express";
import cors from "cors";

const app = express();

// 1. Middleware
app.use(cors()); // Cho phép Frontend gọi API
app.use(express.json()); // Để đọc được JSON từ body request

// 2. Test Route (Để kiểm tra server sống hay chết)
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Hello! Chat Service is running 🚀",
    timestamp: new Date(),
  });
});

// 3. Health Check (Để kiểm tra kết nối DB sau này)
app.get("/health", (req: Request, res: Response) => {
  res.status(200).send("OK");
});

export default app;
