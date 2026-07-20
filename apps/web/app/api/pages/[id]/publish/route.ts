import { NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { auth } from '@/lib/auth';
import { eventBus } from '@/lib/events';
import { scanPages, filterDiagnostics } from '@/lib/diagnostics/engine';
import { triggerWebhooks } from '@/lib/webhooks';
import { logActivity } from '@/lib/activity';
import type { DiagnosticPage } from '@fluid/types';

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
      include: { project: { select: { id: true, published: true } } },
    });
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (!page.project.published) {
      return NextResponse.json(
        { error: 'Project must be published before pages can be published', code: 'PROJECT_NOT_PUBLISHED' },
        { status: 400 },
      );
    }

    if (!page.title || page.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Page must have a title before publishing', code: 'MISSING_TITLE' },
        { status: 400 },
      );
    }

    // Create snapshot before publishing (version safety net)
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

    // Run diagnostics on this page for validation
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

    // Publish the page
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
  } catch (error) {
    console.error('Failed to publish page:', error);
    return NextResponse.json(
      { error: 'Failed to publish page' },
      { status: 500 },
    );
  }
}
