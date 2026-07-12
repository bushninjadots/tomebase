import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@fluid/ui', '@fluid/utils', '@fluid/database', '@fluid/types'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  serverExternalPackages: ['bcryptjs'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ],
};

export default nextConfig;
