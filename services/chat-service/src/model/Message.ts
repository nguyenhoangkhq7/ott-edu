import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
}

const messageSchema: Schema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true // Chỉ bao gồm text cho phiên bản cơ bản hiện tại
    }
  },
  {
    timestamps: true // Tự động tạo createdAt giúp sắp xếp tin nhắn
  }
);

// Tạo đa index cho conversationId kết hợp với createdAt để lấy lịch sử chat nhanh nhất
// -1 để có thể dễ dàng lấy các tin nhắn mới nhất
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model<IMessage>('Message', messageSchema);

export default Message;
