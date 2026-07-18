import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { requireAuth } from '@/lib/authorization';
import { buildIndexForProject } from '@/lib/repository-index/builder';
import { queryIndex } from '@/lib/repository-index/query';
import type { RepositoryIndexQuery } from '@fluid/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const membership = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        team: { projects: { some: { id } } },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const result = await buildIndexForProject(id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Repository index build error:', error);
    return NextResponse.json(
      { error: `Index build failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const membership = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        team: { projects: { some: { id } } },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const queryParam = searchParams.get('query') || '';
    const symbolType = searchParams.get('symbolType') || 'all';
    const kind = searchParams.get('kind') || 'all';
    const pageId = searchParams.get('pageId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: RepositoryIndexQuery = {
      projectId: id,
      query: queryParam,
      symbolType: symbolType as RepositoryIndexQuery['symbolType'],
      kind: kind as RepositoryIndexQuery['kind'],
      pageId,
      limit,
    };

    const result = await queryIndex(query);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Repository index query error:', error);
    return NextResponse.json(
      { error: `Index query failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 },
    );
  }
}
