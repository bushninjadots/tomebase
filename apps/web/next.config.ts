import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@fluid/ui', '@fluid/utils', '@fluid/database', '@fluid/types', '@fluid/codegen'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
