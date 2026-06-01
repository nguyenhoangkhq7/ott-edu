// Cấu hình chuẩn mặc định của Expo (Đảm bảo an toàn 100% không ảnh hưởng code cũ)
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;