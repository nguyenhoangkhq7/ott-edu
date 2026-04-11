import Constants from "expo-constants";

// 1. Lấy URL từ .env (Dành cho khi đã deploy lên AWS/Store)
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

// 2. Lấy IP máy tính (Dành cho lúc Dev chạy localhost)
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(":")[0];

// Logic chọn URL: Ưu tiên .env -> Sau đó đến IP mạng LAN -> Cuối cùng là localhost
// Note: Production uses http://localhost/api/core (via nginx gateway on port 80)
export const API_URL =
  ENV_API_URL ||
  (localhost ? `http://${localhost}` : "http://localhost");

console.log("🔗 Mobile API URL đang dùng:", API_URL);
