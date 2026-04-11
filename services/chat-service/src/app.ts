import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.ts";
import User from "./model/User.ts";
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

function toSingleHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }
  return value || "";
}

function fallbackFullNameFromEmail(email: string): string {
  return email.split("@")[0] || "User";
}

// Dev auth adapter:
// - Ưu tiên x-user-id nếu là Mongo ObjectId
// - Nếu có x-user-email thì map/create chat user từ email để dùng với AuthProvider
app.use(async (req: any, res: Response, next: NextFunction) => {
  try {
    const rawUserId = toSingleHeaderValue(req.headers["x-user-id"]).trim();
    const rawUserEmail = toSingleHeaderValue(req.headers["x-user-email"])
      .trim()
      .toLowerCase();
    const rawUserName = toSingleHeaderValue(req.headers["x-user-name"]).trim();
    const rawAvatarUrl = toSingleHeaderValue(req.headers["x-user-avatar"]).trim();
    const rawUserCode = toSingleHeaderValue(req.headers["x-user-code"]).trim();

    if (rawUserId && mongoose.Types.ObjectId.isValid(rawUserId)) {
      req.user = { _id: rawUserId };
      return next();
    }

    if (rawUserEmail) {
      let user = await User.findOne({ email: rawUserEmail });

      if (!user) {
        user = await User.create({
          email: rawUserEmail,
          fullName: rawUserName || fallbackFullNameFromEmail(rawUserEmail),
          avatarUrl: rawAvatarUrl || undefined,
          code: rawUserCode || undefined,
        });
      } else {
        const nextCode = rawUserCode || user.code || "";
        const nextName = rawUserName || user.fullName;
        const nextAvatar = rawAvatarUrl || user.avatarUrl;
        if (
          nextCode !== (user.code || "") ||
          nextName !== user.fullName ||
          nextAvatar !== user.avatarUrl
        ) {
          user.code = nextCode || undefined;
          user.fullName = nextName;
          user.avatarUrl = nextAvatar;
          await user.save();
        }
      }

      req.user = {
        _id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      };
    } else if (rawUserId) {
      req.user = { _id: rawUserId };
    }

    return next();
  } catch (error: any) {
    console.error("[app] auth adapter error:", error);
    return res.status(500).json({
      error: "Failed to resolve chat user",
      detail: error.message,
    });
  }
});

// Đăng ký chat routes vào path /api
app.use("/api", chatRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

export default app;
