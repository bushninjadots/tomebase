import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { scanPages, type ScanOptions } from '@/lib/diagnostics/engine';
import type { DiagnosticPage } from '@fluid/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { team: { include: { members: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isMember = project.team?.members.some(
      (m) => m.userId === session.user!.id,
    );
    if (!isMember && project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rulesParam = searchParams.get('rules');
    const categoriesParam = searchParams.get('categories');

    const options: ScanOptions = {};
    if (rulesParam) options.rules = rulesParam.split(',');
    if (categoriesParam) options.categories = categoriesParam.split(',');

    const [pages, ignoredRecords] = await Promise.all([
      prisma.docPage.findMany({
        where: { projectId },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          description: true,
          published: true,
          viewCount: true,
          lastViewedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { title: 'asc' },
      }),
      prisma.ignoredDiagnostic.findMany({
        where: { projectId },
        select: { ruleId: true, pageId: true },
      }),
    ]);

    const diagnosticPages: DiagnosticPage[] = pages.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      content: p.content,
      description: p.description,
      published: p.published,
      viewCount: p.viewCount,
      lastViewedAt: p.lastViewedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    const result = scanPages(diagnosticPages, options);

    // Build ignore lookup: "ruleId:pageId" for page-specific, "ruleId:" for project-wide
    const ignoredKeys = new Set<string>();
    for (const rec of ignoredRecords) {
      ignoredKeys.add(`${rec.ruleId}:${rec.pageId ?? ''}`);
    }

    // Mark ignored diagnostics
    const diagnostics = result.diagnostics.map((d) => {
      const pageKey = `${d.rule}:${d.pageId}`;
      const projectKey = `${d.rule}:`;
      if (ignoredKeys.has(pageKey) || ignoredKeys.has(projectKey)) {
        return { ...d, ignored: true };
      }
      return d;
    });

    return NextResponse.json({ ...result, diagnostics });
  } catch (error) {
    console.error('Diagnostics scan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
