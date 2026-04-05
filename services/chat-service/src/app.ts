import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import connectDB from "./config/db.ts";
import chatRoutes from "./routes/chat.routes.ts";

const app: Application = express();

connectDB();

app.use(cors({
  origin: [
    "http://localhost:3000",
    process.env.WEB_APP_URL || "http://localhost:3000",
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// LƯU Ý: Giả lập middleware Auth (Tạm thời) để có req.user._id test trong Postman
// Trong thực tế, bạn sẽ dùng authMiddleware (ví dụ xác thực JWT jwt.verify()) thay thế đoạn này.
app.use((req: any, res: any, next: any) => {
  // Postman có thể truyền header 'x-user-id' để giả lập đang đăng nhập bằng user đó
  const testUserId = req.headers["x-user-id"];
  if (testUserId) {
    req.user = { _id: testUserId };
  }
  next();
});

// Đăng ký chat routes vào path /api
app.use("/api", chatRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

export default app;
