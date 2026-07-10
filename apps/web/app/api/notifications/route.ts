import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teams = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
      select: { teamId: true },
    });

    if (teams.length === 0) return NextResponse.json({ count: 0, comments: [] });

    const teamIds = teams.map((t) => t.teamId);

    const projects = await prisma.project.findMany({
      where: { teamId: { in: teamIds } },
      select: { id: true },
    });

    if (projects.length === 0) return NextResponse.json({ count: 0, comments: [] });

    const projectIds = projects.map((p) => p.id);

    const comments = await prisma.comment.findMany({
      where: { page: { projectId: { in: projectIds } } },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { name: true } },
        page: { select: { id: true, title: true, slug: true, projectId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      count: comments.length,
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content.slice(0, 120),
        userName: c.user.name ?? 'Someone',
        pageTitle: c.page.title,
        pageSlug: c.page.slug,
        projectId: c.page.projectId,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ count: 0, comments: [] });
  }
}
