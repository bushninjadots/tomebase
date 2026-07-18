import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { requireAuth, requireTeamMember } from '@/lib/authorization';
import { scanPages } from '@/lib/diagnostics/engine';
import type { DiagnosticPage } from '@fluid/types';

export async function GET(
  request: Request,
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

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);

    const pages = await prisma.docPage.findMany({
      where: { projectId },
      select: {
        id: true, title: true, slug: true, published: true,
        viewCount: true, lastViewedAt: true, updatedAt: true, createdAt: true, content: true,
      },
      orderBy: { title: 'asc' },
    });

    const diagnosticPages: DiagnosticPage[] = pages.map((p) => ({
      id: p.id, title: p.title, slug: p.slug, content: p.content,
      description: null, published: p.published, viewCount: p.viewCount,
      lastViewedAt: p.lastViewedAt, createdAt: p.createdAt, updatedAt: p.updatedAt,
    }));
    const scanResult = scanPages(diagnosticPages);

    const latestReport = await prisma.healthReport.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { score: true, createdAt: true },
    });

    return NextResponse.json({
      score: scanResult.healthScore.score,
      totalPages: pages.length,
      issues: scanResult.diagnostics,
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
  request: Request,
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

    const pages = await prisma.docPage.findMany({
      where: { projectId },
      select: {
        id: true, title: true, slug: true, published: true,
        viewCount: true, lastViewedAt: true, updatedAt: true, createdAt: true, content: true,
      },
      orderBy: { title: 'asc' },
    });

    const diagnosticPages: DiagnosticPage[] = pages.map((p) => ({
      id: p.id, title: p.title, slug: p.slug, content: p.content,
      description: null, published: p.published, viewCount: p.viewCount,
      lastViewedAt: p.lastViewedAt, createdAt: p.createdAt, updatedAt: p.updatedAt,
    }));
    const scanResult = scanPages(diagnosticPages);

    const saved = await prisma.healthReport.create({
      data: {
        projectId,
        score: scanResult.healthScore.score,
        totalPages: pages.length,
        issues: scanResult.diagnostics as unknown as object[],
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
