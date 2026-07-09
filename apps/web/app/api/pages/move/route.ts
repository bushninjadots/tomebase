import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, order, parentId } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
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

    const updateData: Record<string, unknown> = {};

    if (typeof order === 'number') updateData.order = order;
    if (parentId !== undefined) updateData.parentId = parentId || null;

    const updated = await prisma.docPage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to move page:', error);
    return NextResponse.json({ error: 'Failed to move page' }, { status: 500 });
  }
}
