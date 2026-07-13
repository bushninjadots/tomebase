import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const projects = await prisma.project.findMany({
      where: {
        team: { members: { some: { userId: session.user.id } } },
      },
      select: { id: true, name: true, slug: true },
    });

    if (projects.length === 0) return NextResponse.json([]);

    const projectIds = projects.map((p) => p.id);
    const projectMap = new Map(projects.map((p) => [p.id, p]));

    const lower = q.toLowerCase();

    const pages = await prisma.docPage.findMany({
      where: {
        projectId: { in: projectIds },
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        projectId: true,
        content: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    const results = pages
      .map((page) => {
        const titleMatch = page.title.toLowerCase().includes(lower);
        const contentMatch = page.content.toLowerCase().includes(lower);
        let score = 0;
        if (titleMatch) score += 10;
        if (contentMatch) score += 1;

        const idx = page.content.toLowerCase().indexOf(lower);
        const snippet =
          idx >= 0
            ? page.content.slice(Math.max(0, idx - 40), idx + 80).replace(/\n/g, ' ')
            : '';

        return {
          id: page.id,
          title: page.title,
          slug: page.slug,
          projectId: page.projectId,
          projectName: projectMap.get(page.projectId)?.name ?? '',
          snippet,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
