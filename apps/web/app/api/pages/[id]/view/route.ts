import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const page = await prisma.docPage.findUnique({
      where: { id },
      select: { id: true, published: true, project: { select: { published: true } } },
    });
    if (!page || !page.published || !page.project.published) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const now = new Date();
    
    await prisma.$transaction([
      prisma.docPage.update({
        where: { id },
        data: { 
          viewCount: { increment: 1 },
          lastViewedAt: now
        },
      }),
      prisma.viewEvent.create({
        data: {
          pageId: id,
          referrer: request.headers.get('referer') || null,
          userAgent: request.headers.get('user-agent') || null,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          createdAt: now
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record view:', error);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}
