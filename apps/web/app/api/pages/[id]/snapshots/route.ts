import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title, content } = await request.json();

    const page = await prisma.docPage.findFirst({
      where: {
        id,
        project: { team: { members: { some: { userId: session.user.id } } } },
      },
    });
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Don't create a snapshot if content hasn't changed
    if (page.title === title && page.content === content) {
      return NextResponse.json({ skipped: true });
    }

    // Keep max 50 snapshots per page
    const count = await prisma.pageSnapshot.count({ where: { pageId: id } });
    if (count >= 50) {
      const oldest = await prisma.pageSnapshot.findFirst({
        where: { pageId: id },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (oldest) {
        await prisma.pageSnapshot.delete({ where: { id: oldest.id } });
      }
    }

    const snapshot = await prisma.pageSnapshot.create({
      data: {
        pageId: id,
        title: page.title,
        content: page.content,
      },
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('Failed to create snapshot:', error);
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
  }
}

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

    const page = await prisma.docPage.findFirst({
      where: {
        id,
        project: { team: { members: { some: { userId: session.user.id } } } },
      },
    });
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const snapshots = await prisma.pageSnapshot.findMany({
      where: { pageId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(snapshots);
  } catch (error) {
    console.error('Failed to list snapshots:', error);
    return NextResponse.json({ error: 'Failed to list snapshots' }, { status: 500 });
  }
}
