import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  id?: number; // 🚀 1. THÊM DÒNG NÀY ĐỂ HẾT GẠCH ĐỎ TYPESCRIPT
  email: string;
  fullName: string;
  code?: string;
  role: string;
  avatarUrl: string;
}

const userSchema: Schema = new Schema(
  {
    // 🚀 2. THÊM CỘT ID NÀY VÀO ĐỂ LƯU SỐ 2, SỐ 6 CỦA MYSQL
    id: {
      type: Number,
      index: true,
      unique: true,
      sparse: true // ⚠️ BẮT BUỘC CÓ: Để những user cũ (không có id) không bị lỗi Duplicate E11000
    },
    email: {
      type: String,
      required: true,
      unique: true,
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
      default: 'https://via.placeholder.com/150'
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true
  }
);

userSchema.index({ email: 1 });

const User = mongoose.model<IUser>('User', userSchema);

export default User;