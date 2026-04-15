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
      {
        protocol: 'https',
        hostname: 'product-images-hau.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**', // Cho phép lấy avatar từ pravatar
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
      },
      {
        source: '/api/assignment/:path*',
        destination: 'http://gateway:80/api/assignment/:path*',
      }
    ];
  },
};

export default nextConfig;
