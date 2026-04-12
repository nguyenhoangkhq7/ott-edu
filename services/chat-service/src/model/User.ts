import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  fullName: string;
  code?: string;
  role: string;
  avatarUrl: string;
}

const userSchema: Schema = new Schema(
  {
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
    }
  },
  {
    timestamps: true // Tự động sinh `createdAt` và `updatedAt`
  }
);

// Tạo index cho email để query nhanh hơn
userSchema.index({ email: 1 });

const User = mongoose.model<IUser>('User', userSchema);

export default User;
