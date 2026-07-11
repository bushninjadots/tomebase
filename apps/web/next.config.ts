import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@fluid/ui', '@fluid/utils', '@fluid/database', '@fluid/types'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  serverExternalPackages: ['bcryptjs'],
};

export default nextConfig;
