import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@fluid/ui',
    '@fluid/utils',
    '@fluid/database',
    '@fluid/types',
    '@fluid/codegen',
  ],
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
        { key: 'X-XSS-Protection', value: '0' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://plausible.io",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https: http:",
            "font-src 'self'",
            "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://api.github.com https://api.vercel.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://plausible.io",
            "frame-src https://js.stripe.com https://checkout.stripe.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
          ].join('; '),
        },
      ],
    },
  ],
};

export default nextConfig;
