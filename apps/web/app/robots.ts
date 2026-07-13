import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || 'https://tomebase.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/docs/', '/p/', '/dashboard/', '/invite/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
