import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const page = await prisma.docPage.findUnique({ where: { id } });
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    await prisma.docPage.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record view:', error);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}
