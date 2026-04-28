import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  const mongoUri =
    process.env.MONGO_CHAT_URI || "mongodb://localhost:27017/chat_history_db";

  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      const conn = await mongoose.connect(mongoUri);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error: any) {
      const retryDelayMs = Math.min(15000, 1000 * attempt);
      console.error(
        `❌ MongoDB connect failed (attempt ${attempt}): ${error.message}. Retrying in ${retryDelayMs}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
};

export default connectDB;
