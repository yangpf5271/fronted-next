/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  output: 'standalone', // 启用 standalone 模式用于 Docker 部署
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL ,
  },
  images: {
    domains: ['localhost', '10.0.0.87'], // 根据需要添加
  },
};

export default nextConfig;