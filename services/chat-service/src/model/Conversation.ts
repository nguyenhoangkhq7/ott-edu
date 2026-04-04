import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
}

const conversationSchema: Schema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User' // Tham chiếu đến model User
      }
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message', // Tham chiếu đến model Message, dùng để hiển thị inbox nhanh
      required: false
    }
  },
  {
    timestamps: true // Tự động tạo createdAt, updatedAt cho cuộc hội thoại
  }
);

// Thêm index trên participants để tối ưu truy vấn danh sách hội thoại
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);

export default Conversation;
