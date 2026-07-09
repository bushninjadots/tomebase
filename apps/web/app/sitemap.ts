import { prisma } from '@fluid/database';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL || 'https://usedocs.com';

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'monthly', priority: 1.0 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      select: { id: true, updatedAt: true, pages: { where: { published: true }, select: { slug: true, updatedAt: true } } },
    });

    for (const project of projects) {
      staticPages.push({
        url: `${baseUrl}/p/${project.id}`,
        lastModified: project.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      });

      for (const page of project.pages) {
        staticPages.push({
          url: `${baseUrl}/p/${project.id}/${page.slug}`,
          lastModified: page.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }
  } catch {
    // If DB is not available, return static pages only
  }

  return staticPages;
}
