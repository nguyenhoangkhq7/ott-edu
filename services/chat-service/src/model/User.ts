import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string;
}

const userSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      // Kiểm tra định dạng email bằng regex
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    fullName: {
      type: String,
      required: true
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
