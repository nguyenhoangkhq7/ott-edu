# --- 1. Base Stage ---
FROM node:24-alpine3.23 AS base

# --- 2. Dependencies Stage (Dùng cho DEV) ---
# Đặt tên stage là 'deps'
FROM base AS deps
# Cài thêm libc6-compat để tránh lỗi thư viện ảnh trên Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
# Cài tất cả dependencies
RUN npm install 

# --- 3. Builder Stage (Dùng cho PROD) ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- 4. Runner Stage (Chạy thật) ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
# ... (Các cấu hình copy standalone như bài cũ) ...
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

CMD ["node", "server.js"]