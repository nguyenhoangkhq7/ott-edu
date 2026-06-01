# --- 1. Base Stage (Dùng để cài đặt và compile Mediasoup bằng các công cụ dịch C++) ---
FROM node:24-slim AS base
WORKDIR /app

# Cài đặt các công cụ biên dịch C++ cần thiết cho mediasoup
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
# Cài đặt toàn bộ dependencies (bao gồm cả compiler dependencies)
RUN npm install

# --- 2. Dev Stage (Dùng cho môi trường Development) ---
FROM base AS dev
COPY . .
CMD ["npm", "run", "dev"]

# --- 3. Production Stage (Chạy thật - Tận dụng tính năng Native TS của Node 24!) ---
# Sử dụng ảnh node-slim siêu nhẹ (không có compiler tools nặng nề) cho Production
FROM node:24-slim AS production
WORKDIR /app
COPY package*.json ./

# Copy node_modules (đã được compile thành công mediasoup) từ base stage sang
COPY --from=base /app/node_modules ./node_modules

# Dọn dẹp devDependencies để thu nhỏ tối đa dung lượng container
RUN npm prune --production

# Copy mã nguồn TypeScript (.ts) để chạy trực tiếp
COPY . .

# Khởi chạy trực tiếp file .ts bằng tính năng Native TypeScript của Node 24!
# Cờ --experimental-strip-types giúp chạy file .ts trực tiếp với hiệu năng tối đa mà không cần build tsc
CMD ["node", "--experimental-strip-types", "--max-old-space-size=120", "src/server.ts"]