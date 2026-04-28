import mongoose, { Schema, type InferSchemaType } from "mongoose";

const callLogSchema = new Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    callerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    calleeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["ringing", "connected", "ended", "declined", "unavailable", "failed"],
      default: "ringing",
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    connectedAt: {
      type: Date,
      required: false,
    },
    endedAt: {
      type: Date,
      required: false,
    },
    durationSec: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    endReason: {
      type: String,
      required: false,
      trim: true,
      maxlength: 120,
    },
  },
  {
    timestamps: true,
  },
);

callLogSchema.index({ callerId: 1, createdAt: -1 });
callLogSchema.index({ calleeId: 1, createdAt: -1 });
callLogSchema.index({ conversationId: 1, createdAt: -1 });

export type CallLog = InferSchemaType<typeof callLogSchema>;

export default mongoose.models.CallLog || mongoose.model("CallLog", callLogSchema);
