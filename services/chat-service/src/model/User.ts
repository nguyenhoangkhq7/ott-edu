import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  accountId?: number;
  email: string;
  fullName: string;
  code?: string;
  role: string;
  avatarUrl: string;
  friends: mongoose.Types.ObjectId[];
  friendRequests: mongoose.Types.ObjectId[];
}

const userSchema: Schema = new Schema(
  {
    accountId: { type: Number, unique: true, sparse: true },
    email: {
      type: String,
      required: true,
      unique: true,
      // Cho phép các địa chỉ email hợp lệ phổ biến, gồm cả dấu + và TLD dài
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không hợp lệ']
    },
    fullName: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: false,
      index: true,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student'
    },
    avatarUrl: {
      type: String,
      default: 'https://via.placeholder.com/150' // Link ảnh placeholder mặc định
    },
    friends: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  friendRequests: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
  },
  {
    timestamps: true // Tự động sinh `createdAt` và `updatedAt`
  }
);

// Tạo index cho email để query nhanh hơn
userSchema.index({ email: 1 });

const User = mongoose.model<IUser>('User', userSchema);

export default User;
