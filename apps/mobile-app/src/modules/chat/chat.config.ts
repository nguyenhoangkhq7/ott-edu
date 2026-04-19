import Constants from "expo-constants";

const ENV_CHAT_SERVICE_URL = process.env.EXPO_PUBLIC_CHAT_SERVICE_URL;
const debuggerHost = Constants.expoConfig?.hostUri;
const localHost = debuggerHost?.split(":")[0];

export const CHAT_SERVICE_URL =
  ENV_CHAT_SERVICE_URL ||
  (localHost ? `http://${localHost}:3001` : "http://localhost:3001");

export const CHAT_API_URL = `${CHAT_SERVICE_URL.replace(/\/$/, "")}/api`;
