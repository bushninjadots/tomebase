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
    const { snapshotId } = await request.json();

    if (!snapshotId) {
      return NextResponse.json({ error: 'snapshotId is required' }, { status: 400 });
    }

    const page = await prisma.docPage.findFirst({
      where: {
        id,
        project: { team: { members: { some: { userId: session.user.id } } } },
      },
    });
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const snapshot = await prisma.pageSnapshot.findUnique({
      where: { id: snapshotId },
    });
    if (!snapshot || snapshot.pageId !== id) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    const updated = await prisma.docPage.update({
      where: { id },
      data: {
        title: snapshot.title,
        content: snapshot.content,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to restore snapshot:', error);
    return NextResponse.json({ error: 'Failed to restore snapshot' }, { status: 500 });
  }
}
