import { NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { auth } from '@/lib/auth';
import { eventBus } from '@/lib/events';
import { triggerWebhooks } from '@/lib/webhooks';
import { logActivity } from '@/lib/activity';

export async function POST(
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
      include: { project: { select: { id: true } } },
    });
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (!page.published) {
      return NextResponse.json(
        { error: 'Page is not published', code: 'NOT_PUBLISHED' },
        { status: 400 },
      );
    }

    // Create snapshot before unpublishing (version safety net)
    await prisma.pageSnapshot.create({
      data: {
        pageId: id,
        title: page.title,
        content: page.content,
        reason: 'pre-unpublish',
      },
    });

    // Unpublish the page
    const updated = await prisma.docPage.update({
      where: { id },
      data: { published: false },
    });

    eventBus.emit('page:unpublished', { pageId: id, projectId: page.project.id });

    triggerWebhooks(page.project.id, 'page.unpublished', {
      pageId: id,
      title: page.title,
      slug: page.slug,
    });

    logActivity({
      userId: session.user.id,
      action: 'page.unpublished',
      entity: 'page',
      entityId: id,
      details: { title: page.title },
    });

    return NextResponse.json({
      success: true,
      page: {
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        published: updated.published,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Failed to unpublish page:', error);
    return NextResponse.json(
      { error: 'Failed to unpublish page' },
      { status: 500 },
    );
  }
}
