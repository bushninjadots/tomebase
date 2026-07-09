import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  try {
    const { id, order, parentId } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (typeof order === 'number') updateData.order = order;
    if (parentId !== undefined) updateData.parentId = parentId || null;

    const page = await prisma.docPage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error('Failed to move page:', error);
    return NextResponse.json({ error: 'Failed to move page' }, { status: 500 });
  }
}
