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

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  attachments?: Attachment[];
  replyTo?: mongoose.Types.ObjectId;
  isRevoked: boolean;
  reactions: Reaction[];
}

const attachmentSchema: Schema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const reactionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emoji: {
      type: String,
      required: true,
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
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: false,
      default: null,
    },
    isRevoked: {
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
