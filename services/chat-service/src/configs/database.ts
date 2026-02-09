import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Lấy biến môi trường (Docker đã nạp vào rồi)
    const host = process.env.MONGO_HOST || "localhost";
    const port = process.env.MONGO_PORT || "27017";
    const user = process.env.MONGO_INITDB_ROOT_USERNAME;
    const pass = process.env.MONGO_INITDB_ROOT_PASSWORD;
    const dbName = process.env.MONGO_DB_NAME;

    // Chuỗi kết nối chuẩn cho Docker
    const connectionString = `mongodb://${user}:${pass}@${host}:${port}/${dbName}?authSource=admin`;

    await mongoose.connect(connectionString);
    console.log("✅ MongoDB Connected Successfully via Mongoose");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

export default connectDB;
