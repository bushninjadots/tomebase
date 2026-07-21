import { NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { getPageWithProjectAccess } from '@/lib/authorization';
import { eventBus } from '@/lib/events';
import { scanPages, filterDiagnostics } from '@/lib/diagnostics/engine';
import { triggerWebhooks } from '@/lib/webhooks';
import { logActivity } from '@/lib/activity';
import { withAuth, notFound, badRequest } from '@/lib/api-helpers';
import type { DiagnosticPage } from '@fluid/types';

export const POST = withAuth(async (session, _request, { params }) => {
  const { id } = await params;

  const page = await getPageWithProjectAccess(id, session.user.id);
  if (!page) return notFound('Page not found');

  if (!page.project.published) {
    return badRequest('Project must be published before pages can be published', 'PROJECT_NOT_PUBLISHED');
  }

  if (!page.title || page.title.trim().length === 0) {
    return badRequest('Page must have a title before publishing', 'MISSING_TITLE');
  }

  const existingSnapshot = await prisma.pageSnapshot.findFirst({
    where: { pageId: id },
    orderBy: { createdAt: 'desc' },
  });

  const contentChanged = !existingSnapshot || existingSnapshot.content !== page.content;
  if (contentChanged) {
    await prisma.pageSnapshot.create({
      data: {
        pageId: id,
        title: page.title,
        content: page.content,
        reason: 'pre-publish',
      },
    });
  }

  const allPages = await prisma.docPage.findMany({
    where: { projectId: page.projectId },
    select: {
      id: true, title: true, slug: true, content: true, description: true,
      published: true, viewCount: true, lastViewedAt: true,
      createdAt: true, updatedAt: true,
    },
  });

  const diagnosticPages: DiagnosticPage[] = allPages.map((p) => ({
    id: p.id, title: p.title, slug: p.slug, content: p.content,
    description: p.description, published: p.published, viewCount: p.viewCount,
    lastViewedAt: p.lastViewedAt, createdAt: p.createdAt, updatedAt: p.updatedAt,
  }));

  const scanResult = scanPages(diagnosticPages);
  const pageDiagnostics = filterDiagnostics(scanResult.diagnostics, {
    severity: 'all', category: 'all', pageId: id, canAutoFix: null, search: '',
  });

  const errors = pageDiagnostics.filter((d) => d.severity === 'error');
  const warnings = pageDiagnostics.filter((d) => d.severity === 'warning');

  const updated = await prisma.docPage.update({
    where: { id },
    data: { published: true },
  });

  eventBus.emit('page:published', { pageId: id, projectId: page.projectId });

  triggerWebhooks(page.projectId, 'page.published', {
    pageId: id,
    title: page.title,
    slug: page.slug,
  });

  logActivity({
    userId: session.user.id,
    action: 'page.published',
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
    validation: {
      errors: errors.length,
      warnings: warnings.length,
      diagnostics: pageDiagnostics.map((d) => ({
        id: d.id,
        severity: d.severity,
        title: d.title,
        description: d.description,
        category: d.category,
        line: d.line,
      })),
    },
  });
});
