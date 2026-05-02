# --- 1. Base Stage (Dùng chung cho cả Dev và Prod) ---
FROM node:24-slim AS base
WORKDIR /app

# Install build dependencies for mediasoup on Debian/Ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    make \
    g++ \
    gcc \
    libtool \
    autoconf \
    automake \
    build-essential \
    linux-headers-generic \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# --- 2. Dependencies Stage (Dùng cho DEV) ---
# Đặt tên stage này là 'dev' để docker-compose trỏ vào
FROM base AS dev
# Cài TOÀN BỘ thư viện (bao gồm cả nodemon, ts-node)
RUN npm install 
COPY . .
# Lệnh mặc định nếu chạy lẻ (Docker Compose sẽ ghi đè lệnh này bằng 'npm run dev')
CMD ["npm", "run", "dev"]

# --- 3. Builder Stage (Dùng cho PROD) ---
FROM base AS builder
RUN npm install
COPY . .
RUN npm run build

# --- 4. Production Stage (Chạy thật) ---
FROM node:24-slim AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/server.js"]