import { NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { getPageWithProjectAccess } from '@/lib/authorization';
import { eventBus } from '@/lib/events';
import { triggerWebhooks } from '@/lib/webhooks';
import { logActivity } from '@/lib/activity';
import { withAuth, notFound, badRequest } from '@/lib/api-helpers';

export const POST = withAuth(async (session, _request, { params }) => {
  const { id } = await params;

  const page = await getPageWithProjectAccess(id, session.user.id);
  if (!page) return notFound('Page not found');

  if (!page.published) {
    return badRequest('Page is not published', 'NOT_PUBLISHED');
  }

  await prisma.pageSnapshot.create({
    data: {
      pageId: id,
      title: page.title,
      content: page.content,
      reason: 'pre-unpublish',
    },
  });

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
});
