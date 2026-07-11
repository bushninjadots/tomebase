import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { requireAuth, requireTeamMember } from '@/lib/authorization';

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
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);

    const reports = await prisma.healthReport.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        score: true,
        totalPages: true,
        issues: true,
        summary: true,
        createdAt: true,
      },
    });

    const trend = reports.map((r) => ({
      id: r.id,
      score: r.score,
      totalPages: r.totalPages,
      issueCount: Array.isArray(r.issues) ? r.issues.length : 0,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ reports: trend });
  } catch (error) {
    console.error('Failed to fetch health reports:', error);
    return NextResponse.json({ error: 'Failed to fetch health reports' }, { status: 500 });
  }
}
