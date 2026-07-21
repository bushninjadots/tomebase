import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { requireAuth, getPageWithProjectAccess } from '@/lib/authorization';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const pageId = id;

    const page = await getPageWithProjectAccess(pageId, session.user.id);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const existing = await prisma.bookmark.findUnique({
      where: { pageId_userId: { pageId, userId: session.user.id } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ bookmarked: false });
    }

    await prisma.bookmark.create({
      data: { pageId, userId: session.user.id },
    });

    return NextResponse.json({ bookmarked: true });
  } catch (error) {
    console.error('Failed to toggle bookmark:', error);
    return NextResponse.json({ error: 'Failed to toggle bookmark' }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const pageId = id;

    const page = await getPageWithProjectAccess(pageId, session.user.id);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: { pageId_userId: { pageId, userId: session.user.id } },
    });

    return NextResponse.json({ bookmarked: !!bookmark });
  } catch (error) {
    console.error('Failed to check bookmark status:', error);
    return NextResponse.json({ error: 'Failed to check bookmark status' }, { status: 500 });
  }
}
