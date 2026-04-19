import mongoose, { Document, Schema } from "mongoose";

export interface Attachment {
  url: string;
  fileType: string;
  fileName: string;
}

export interface Reaction {
  userId: mongoose.Types.ObjectId;
  emoji: string;
}

// LinkPreview interface để lưu dữ liệu meta của URL
export interface LinkPreview {
  url: string; // URL gốc
  title?: string; // Tiêu đề trang web
  description?: string; // Mô tả trang web
  image?: string; // URL ảnh thumbnail
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  attachments?: Attachment[];
  linkPreview?: LinkPreview; // Thêm field link preview
  replyTo?: mongoose.Types.ObjectId;
  /** Thu hồi với TẤT CẢ mọi người */
  isRevoked: boolean;
  /** Thu hồi chỉ với BẢN THÂN (mảng userId đã tự thu hồi) */
  revokedFor: mongoose.Types.ObjectId[];
  /** Đánh dấu tin nhắn chuyển tiếp */
  isForwarded?: boolean;
  reactions: Reaction[];
  createdAt: Date;
  updatedAt: Date;
}

/** Giới hạn thời gian (ms) cho phép thu hồi với tất cả mọi người - 15 phút */
export const REVOKE_FOR_ALL_LIMIT_MS = 15 * 60 * 1000;

const attachmentSchema: Schema = new Schema(
  {
    url: { type: String, required: true },
    fileType: { type: String, required: true },
    fileName: { type: String, required: true },
  },
  { _id: false },
);

const reactionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true },
  },
  { _id: false },
);

// Schema cho Link Preview metadata
const linkPreviewSchema: Schema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
  },
  { _id: false },
);

const messageSchema: Schema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function (this: IMessage, value: string) {
          const hasContent = typeof value === "string" && value.trim().length > 0;
          const hasAttachments =
            Array.isArray(this.attachments) && this.attachments.length > 0;
          return hasContent || hasAttachments;
        },
        message: "Content or attachments is required",
      },
    },
    attachments: [attachmentSchema],
    linkPreview: {
      type: linkPreviewSchema,
      default: null,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: false,
      default: null,
    },
    /** true = đã thu hồi với tất cả mọi người */
    isRevoked: {
      type: Boolean,
      default: false,
    },
    /** Mảng userId đã tự thu hồi về phía mình (chỉ ẩn với họ) */
    revokedFor: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    /** Đánh dấu tin nhắn chuyển tiếp */
    isForwarded: {
      type: Boolean,
      default: false,
    },
    reactions: [reactionSchema],
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message;
