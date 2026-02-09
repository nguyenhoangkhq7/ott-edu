// Server Configuration
const PORT = parseInt(process.env.CHAT_PORT || "3001", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
const LOG_LEVEL = process.env.LOG_LEVEL || "debug";

// MongoDB Configuration
const MONGO_HOST = process.env.MONGO_HOST || "localhost";
const MONGO_PORT = parseInt(process.env.MONGO_PORT || "27017", 10);
const MONGO_USER = process.env.MONGO_INITDB_ROOT_USERNAME || "root";
const MONGO_PASSWORD =
  process.env.MONGO_INITDB_ROOT_PASSWORD || "secret_mongo_pass";
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "chat_history_db";

// Database Connection String
const MONGO_URI = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB_NAME}?authSource=admin`;

// CORS Configuration
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const CORS_CREDENTIALS = process.env.CORS_CREDENTIALS !== "false";

// Socket.IO Configuration
const SOCKET_TRANSPORTS = (
  process.env.SOCKET_TRANSPORTS || "websocket,polling"
).split(",");

// Rate Limiting
const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "900000",
  10,
); // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(
  process.env.RATE_LIMIT_MAX_REQUESTS || "100",
  10,
);

export const config = {
  // Server
  port: PORT,
  nodeEnv: NODE_ENV,
  isDevelopment: NODE_ENV === "development",
  isProduction: NODE_ENV === "production",
  logLevel: LOG_LEVEL,

  // Database
  mongodb: {
    uri: MONGO_URI,
    host: MONGO_HOST,
    port: MONGO_PORT,
    user: MONGO_USER,
    password: MONGO_PASSWORD,
    dbName: MONGO_DB_NAME,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  },

  // CORS
  cors: {
    origin: CORS_ORIGIN,
    credentials: CORS_CREDENTIALS,
  },

  // Socket.IO
  socketIO: {
    transports: SOCKET_TRANSPORTS,
    pingInterval: 25000,
    pingTimeout: 60000,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: RATE_LIMIT_WINDOW_MS,
    maxRequests: RATE_LIMIT_MAX_REQUESTS,
  },
};

// Validate required environment variables
function validateConfig() {
  const requiredVars = ["MONGO_HOST", "MONGO_PORT"];
  const missingVars = requiredVars.filter(
    (v) => !process.env[v] && v !== "MONGO_USER",
  );

  if (missingVars.length > 0) {
    console.warn(
      `[CONFIG] Missing environment variables: ${missingVars.join(", ")}. Using defaults.`,
    );
  }

  if (NODE_ENV === "production") {
    if (!process.env.MONGO_PASSWORD) {
      throw new Error("MONGO_PASSWORD is required in production environment");
    }
    if (!process.env.CORS_ORIGIN) {
      throw new Error("CORS_ORIGIN must be set explicitly in production");
    }
  }
}

validateConfig();

export default config;
