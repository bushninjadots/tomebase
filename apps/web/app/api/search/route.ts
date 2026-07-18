import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fluid/database';
import { searchPages } from '@/lib/search';

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
      select: { id: true },
    });

    if (projects.length === 0) return NextResponse.json([]);

    const results = await searchPages(q, {
      projectIds: projects.map((p) => p.id),
      includeSymbols: true,
      limit: 30,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
