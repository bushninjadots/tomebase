import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/docs/', '/p/', '/dashboard/', '/invite/'],
      },
    ],
    sitemap: 'https://tomebase.vercel.app/sitemap.xml',
  };
}
