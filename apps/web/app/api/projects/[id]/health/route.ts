import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { extractWikiLinks } from '@/lib/wiki';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        team: { members: { some: { userId: session.user.id } } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const pages = await prisma.docPage.findMany({
      where: { projectId: id },
      select: { id: true, title: true, slug: true, content: true, published: true, createdAt: true },
      orderBy: { title: 'asc' },
    });

    const pageTitles = new Set(pages.map((p) => p.title.toLowerCase()));
    const pageTitleMap = new Map(pages.map((p) => [p.title.toLowerCase(), p]));

    const brokenLinks: {
      sourceTitle: string;
      sourceId: string;
      linkText: string;
    }[] = [];

    const linkCounts = new Map<string, number>();
    for (const p of pages) {
      linkCounts.set(p.title.toLowerCase(), 0);
    }

    for (const page of pages) {
      const links = extractWikiLinks(page.content);
      for (const link of links) {
        const normalized = link.toLowerCase();
        const existing = linkCounts.get(normalized);
        if (existing !== undefined) {
          linkCounts.set(normalized, existing + 1);
        }
        if (!pageTitles.has(normalized)) {
          brokenLinks.push({
            sourceTitle: page.title,
            sourceId: page.id,
            linkText: link,
          });
        }
      }
    }

    const orphans = pages
      .filter((p) => {
        const normalized = p.title.toLowerCase();
        const inbound = linkCounts.get(normalized) ?? 0;
        return inbound === 0;
      })
      .map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        published: p.published,
        createdAt: p.createdAt,
      }));

    const emptyPages = pages
      .filter((p) => !p.content || p.content.trim().length === 0)
      .map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        published: p.published,
        createdAt: p.createdAt,
      }));

    return NextResponse.json({
      totalPages: pages.length,
      brokenLinks,
      orphans,
      emptyPages,
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ error: 'Failed to check project health' }, { status: 500 });
  }
}
