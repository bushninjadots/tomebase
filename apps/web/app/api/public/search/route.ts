import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
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

    const lower = q.toLowerCase();

    const pages = await prisma.docPage.findMany({
      where: { projectId, published: true },
      select: { id: true, title: true, slug: true, content: true },
    });

    const results = pages
      .map((p) => {
        const titleMatch = p.title.toLowerCase().includes(lower);
        const contentMatch = p.content.toLowerCase().includes(lower);
        let score = 0;
        if (titleMatch) score += 10;
        if (contentMatch) score += 1;
        if (score === 0) return null;
        const idx = p.content.toLowerCase().indexOf(lower);
        const snippet =
          idx >= 0
            ? p.content.slice(Math.max(0, idx - 40), idx + 80)
            : '';
        return { id: p.id, title: p.title, slug: p.slug, snippet, score };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 20);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Public search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
