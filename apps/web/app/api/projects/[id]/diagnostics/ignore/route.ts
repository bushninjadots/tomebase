import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { requireAuth, requireTeamMember } from '@/lib/authorization';

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

    const ignored = await prisma.ignoredDiagnostic.findMany({
      where: { projectId },
      select: {
        id: true,
        ruleId: true,
        pageId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ignored });
  } catch (error) {
    console.error('Failed to fetch ignored diagnostics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ignored diagnostics' },
      { status: 500 },
    );
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

    const userId = session.user.id;
    const { id: projectId } = await params;
    const project = await requireTeamMember(projectId, userId);
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const { ruleId, pageId } = body as { ruleId?: string; pageId?: string };

    if (!ruleId) {
      return NextResponse.json({ error: 'ruleId is required' }, { status: 400 });
    }

    const existing = await prisma.ignoredDiagnostic.findFirst({
      where: {
        projectId,
        ruleId,
        pageId: pageId ?? null,
      },
    });

    if (existing) {
      await prisma.ignoredDiagnostic.delete({ where: { id: existing.id } });
      return NextResponse.json({ ignored: false });
    }

    await prisma.ignoredDiagnostic.create({
      data: {
        projectId,
        ruleId,
        pageId: pageId ?? null,
        userId,
      },
    });

    return NextResponse.json({ ignored: true });
  } catch (error) {
    console.error('Failed to toggle diagnostic ignore:', error);
    return NextResponse.json(
      { error: 'Failed to toggle diagnostic ignore' },
      { status: 500 },
    );
  }
}
