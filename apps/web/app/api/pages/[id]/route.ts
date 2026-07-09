import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function PATCH(
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

    const updated = await prisma.docPage.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update page:', error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.docPage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete page:', error);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}
