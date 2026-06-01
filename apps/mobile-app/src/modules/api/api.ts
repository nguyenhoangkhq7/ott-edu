import Constants from "expo-constants";

// 1. Lấy URL từ .env (Dành cho khi đã deploy lên AWS/Store)
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

// 2. Lấy IP máy tính (Dành cho lúc Dev chạy localhost)
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(":")[0];

function normalizeApiUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl || rawUrl.trim().length === 0) {
    return undefined;
  }

  const normalized = rawUrl.trim().replace(/\/$/, "");

  try {
    const parsed = new URL(normalized);

    // Guard common misconfiguration: sending plain HTTP to gateway HTTPS port 8000.
    if (parsed.protocol === "http:" && parsed.port === "8000") {
      parsed.port = "8088";
      return parsed.toString().replace(/\/$/, "");
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return normalized;
  }
}

const normalizedEnvApiUrl = normalizeApiUrl(ENV_API_URL);

// Logic chọn URL: Ưu tiên .env -> Sau đó đến IP mạng LAN -> Cuối cùng là localhost
export const API_URL =
  normalizedEnvApiUrl ||
  (localhost ? `http://${localhost}:8088` : "http://localhost:8088");

console.log("🔗 Mobile API URL đang dùng:", API_URL);
