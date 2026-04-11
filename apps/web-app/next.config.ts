import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // THÊM PHẦN IMAGES VÀO ĐÂY:
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'product-images-hau.s3.ap-southeast-1.amazonaws.com',
        port: '',
        pathname: '/**', // Cho phép lấy tất cả ảnh từ bucket này
      },
    ],
  },
  
  // Phần rewrites cũ của bạn giữ nguyên:
  async rewrites() {
    return [
      {
        // Khi thấy request bắt đầu bằng /api/core
        source: '/api/core/:path*',
        // Đẩy sang container gateway, giữ nguyên đường dẫn /api/core/...
        destination: 'http://gateway:80/api/core/:path*',
      },
      {
        source: '/api/chat/:path*',
        destination: 'http://gateway:80/api/chat/:path*',
      }
    ];
  },
};

export default nextConfig;