import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { requireAuth, getPageWithProjectAccess } from '@/lib/authorization';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const pageId = id;
    const body = await request.json();
    const { publishAt, unpublishAt } = body;

    if (!publishAt) {
      return NextResponse.json({ error: 'publishAt is required' }, { status: 400 });
    }

    const page = await getPageWithProjectAccess(pageId, session.user.id);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const schedule = await prisma.scheduledPublish.upsert({
      where: { pageId },
      create: {
        pageId,
        publishAt: new Date(publishAt),
        unpublishAt: unpublishAt ? new Date(unpublishAt) : null,
      },
      update: {
        publishAt: new Date(publishAt),
        unpublishAt: unpublishAt ? new Date(unpublishAt) : null,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Failed to schedule publish:', error);
    return NextResponse.json({ error: 'Failed to schedule publish' }, { status: 500 });
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

    const schedule = await prisma.scheduledPublish.findUnique({
      where: { pageId },
    });

    return NextResponse.json(schedule || null);
  } catch (error) {
    console.error('Failed to fetch schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.scheduledPublish.deleteMany({ where: { pageId } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Failed to delete schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
