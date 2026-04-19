import mongoose, { Document, Schema } from 'mongoose';

export type GroupJoinPolicy = "open" | "approval";

export interface IPendingMemberRequest {
  _id?: mongoose.Types.ObjectId;
  targetUserId: mongoose.Types.ObjectId;
  targetEmail: string;
  targetName: string;
  requestedById: mongoose.Types.ObjectId;
  requestedByName: string;
  createdAt?: Date;
}

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  type: "private" | "class";
  ownerId?: mongoose.Types.ObjectId;
  deputyId?: mongoose.Types.ObjectId | null;
  joinPolicy?: GroupJoinPolicy;
  pendingMemberRequests?: IPendingMemberRequest[];
  teamId?: number;
  name?: string;
  avatarUrl?: string;
  metadata?: any;
  isArchived?: boolean;
}

const conversationSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ["private", "class"],
      default: "private",
    },
    teamId: {
      type: Number,
      index: true,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: function (this: IConversation) {
        return this.type === "class";
      },
    },
    avatarUrl: {
      type: String,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    deputyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
      default: null,
    },
    joinPolicy: {
      type: String,
      enum: ["open", "approval"],
      default: "open",
    },
    pendingMemberRequests: [
      {
        targetUserId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        targetEmail: {
          type: String,
          required: true,
        },
        targetName: {
          type: String,
          required: true,
        },
        requestedById: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        requestedByName: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // Tham chiếu đến model User
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message", // Tham chiếu đến model Message, dùng để hiển thị inbox nhanh
      required: false,
    },
  },
  {
    timestamps: true // Tự động tạo createdAt, updatedAt cho cuộc hội thoại
  }
);

// Thêm index trên participants để tối ưu truy vấn danh sách hội thoại
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);

export default Conversation;
