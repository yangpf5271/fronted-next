/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://10.0.0.87:7777',
  },
  images: {
    domains: ['localhost', '10.0.0.87'], // 根据需要添加
  },
};

export default nextConfig;