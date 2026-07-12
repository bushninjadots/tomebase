import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse, rateLimitHeaders } from '@/lib/rate-limit';

export async function GET(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rl = checkRateLimit(`pubsearch:${ip}`, 30, 60_000);
    const rlResponse = rateLimitResponse(rl);
    if (rlResponse) return rlResponse;

    const rlHeaders = rateLimitHeaders(rl);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const q = searchParams.get('q')?.trim();

    if (!projectId || !q) {
      return NextResponse.json({ results: [] });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { published: true },
    });

    if (!project?.published) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const pages = await prisma.docPage.findMany({
      where: {
        projectId,
        published: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, slug: true, content: true },
      take: 20,
    });

    const lower = q.toLowerCase();
    const results = pages
      .map((p) => {
        const titleMatch = p.title.toLowerCase().includes(lower);
        const contentMatch = p.content.toLowerCase().includes(lower);
        let score = 0;
        if (titleMatch) score += 10;
        if (contentMatch) score += 1;
        const idx = p.content.toLowerCase().indexOf(lower);
        const snippet =
          idx >= 0
            ? p.content.slice(Math.max(0, idx - 40), idx + 80)
            : '';
        return { id: p.id, title: p.title, slug: p.slug, snippet, score };
      })
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({ results }, { headers: rlHeaders });
  } catch (error) {
    console.error('Public search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
