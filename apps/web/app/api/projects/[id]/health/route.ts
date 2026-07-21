import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { requireAuth, requireTeamMember } from '@/lib/authorization';
import { scanPages } from '@/lib/diagnostics/engine';
import { enforceRateLimit } from '@/lib/api-helpers';
import type { DiagnosticPage } from '@fluid/types';

async function loadIgnoredKeys(projectId: string): Promise<Set<string>> {
  const records = await prisma.ignoredDiagnostic.findMany({
    where: { projectId },
    select: { ruleId: true, pageId: true },
  });
  const keys = new Set<string>();
  for (const r of records) {
    keys.add(`${r.ruleId}:${r.pageId ?? ''}`);
  }
  return keys;
}

function markIgnored<T extends { rule: string; pageId: string; ignored?: boolean }>(
  diagnostics: T[],
  ignoredKeys: Set<string>,
): T[] {
  return diagnostics.map((d) => {
    if (ignoredKeys.has(`${d.rule}:${d.pageId}`) || ignoredKeys.has(`${d.rule}:`)) {
      return { ...d, ignored: true };
    }
    return d;
  });
}

async function getDiagnosticPages(projectId: string): Promise<DiagnosticPage[]> {
  const pages = await prisma.docPage.findMany({
    where: { projectId },
    select: {
      id: true, title: true, slug: true, published: true,
      viewCount: true, lastViewedAt: true, updatedAt: true, createdAt: true, content: true,
      description: true,
    },
    orderBy: { title: 'asc' },
  });
  return pages.map((p) => ({
    id: p.id, title: p.title, slug: p.slug, content: p.content,
    description: p.description, published: p.published, viewCount: p.viewCount,
    lastViewedAt: p.lastViewedAt, createdAt: p.createdAt, updatedAt: p.updatedAt,
  }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const project = await requireTeamMember(projectId, session.user.id);
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const [diagnosticPages, ignoredKeys] = await Promise.all([
      getDiagnosticPages(projectId),
      loadIgnoredKeys(projectId),
    ]);

    const scanResult = scanPages(diagnosticPages);

    const latestReport = await prisma.healthReport.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { score: true, createdAt: true },
    });

    const diagnostics = markIgnored(scanResult.diagnostics, ignoredKeys);

    return NextResponse.json({
      score: scanResult.healthScore.score,
      totalPages: diagnosticPages.length,
      issues: diagnostics,
      healthScore: scanResult.healthScore,
      scannedAt: scanResult.scannedAt,
      previousScore: latestReport?.score ?? null,
      previousScanAt: latestReport?.createdAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('Failed to fetch health data:', error);
    return NextResponse.json({ error: 'Failed to fetch health data' }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rl = enforceRateLimit(_request, 'standard');
    if (rl) return rl;

    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const project = await requireTeamMember(projectId, session.user.id);
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const [diagnosticPages, ignoredKeys] = await Promise.all([
      getDiagnosticPages(projectId),
      loadIgnoredKeys(projectId),
    ]);

    const scanResult = scanPages(diagnosticPages);
    const diagnostics = markIgnored(scanResult.diagnostics, ignoredKeys);

    const saved = await prisma.healthReport.create({
      data: {
        projectId,
        score: scanResult.healthScore.score,
        totalPages: diagnosticPages.length,
        issues: diagnostics as unknown as object[],
        summary: scanResult.healthScore.categoryBreakdown as unknown as object[],
      },
    });

    return NextResponse.json({
      reportId: saved.id,
      score: scanResult.healthScore.score,
      scannedAt: saved.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to run health scan:', error);
    return NextResponse.json({ error: 'Failed to run health scan' }, { status: 500 });
  }
}
