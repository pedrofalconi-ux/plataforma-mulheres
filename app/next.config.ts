import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/observatorio',
        destination: '/trilhas',
        permanent: true,
      },
      {
        source: '/carrinho',
        destination: '/trilhas',
        permanent: true,
      },
      {
        source: '/checkout',
        destination: '/trilhas',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
