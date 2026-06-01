import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },

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
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**', // Cho phép lấy thumbnail từ YouTube
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**', // Cho phép lấy avatar từ pravatar
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      // Allow all external link preview images from any HTTPS host
      {
        protocol: 'https',
        hostname: '**.gstatic.com',
        port: '',
        pathname: '/**', // Google static images
      },
      {
        protocol: 'https',
        hostname: '**.gvt1.com',
        port: '',
        pathname: '/**', // Google Vt1 images
      },
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
        port: '',
        pathname: '/**', // GitHub images
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
        port: '',
        pathname: '/**', // Cloudflare images
      },
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**', // Wildcard: Allow ANY HTTPS domain for link previews
      },
    ],
  },
  
  // Phần rewrites cũ của bạn giữ nguyên:
  async rewrites() {
    const gatewayUrl = process.env.BACKEND_GATEWAY_URL || 'http://gateway:80';

    return [
      {
        source: '/api/core/:path*',
        destination: `${gatewayUrl}/api/core/:path*`, 
      },
      {
        source: '/api/chat/:path*',
        destination: `${gatewayUrl}/api/chat/:path*`,
      },
      {
        source: '/api/assignment/:path*',
        destination: `${gatewayUrl}/api/assignment/:path*`,
      },
      {
        source: '/api/v1/:path*',
        destination: `${gatewayUrl}/api/v1/:path*`,
      }
    ];
  },
};

export default nextConfig;
