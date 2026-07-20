import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fluid/database';
import { getOrCreatePersonalTeam } from '@/lib/team';
import { TIERS } from '@/lib/limits';

export interface DashboardData {
  user: { name: string | null; email: string | null; image: string | null };
  tier: string;
  projects: Array<{
    id: string;
    name: string;
    slug: string;
    published: boolean;
    pageCount: number;
    updatedAt: string;
    healthScore: number | null;
  }>;
  stats: {
    projectCount: number;
    pageCount: number;
    publishedCount: number;
    totalViews: number;
    avgHealthScore: number;
    memberCount: number;
  };
  recentPages: Array<{
    id: string;
    title: string;
    slug: string;
    updatedAt: string;
    viewCount: number;
    published: boolean;
    projectId: string;
    projectName: string;
  }>;
  limits: {
    maxProjects: number;
    maxPages: number;
    maxMembers: number;
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (!userExists) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let team;
    try {
      team = await getOrCreatePersonalTeam(session.user.id, session.user.name);
    } catch {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const tier = (team.tier || 'free') as keyof typeof TIERS;

    const projects = await prisma.project.findMany({
      where: { teamId: team.id },
      include: { _count: { select: { pages: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    const projectIds = projects.map((p) => p.id);

    const [memberCount, publishedCount, totalPages, totalViews, recentPages] = await Promise.all([
      prisma.teamMember.count({ where: { teamId: team.id } }),
      prisma.docPage.count({
        where: { projectId: { in: projectIds }, published: true },
      }),
      prisma.docPage.count({ where: { projectId: { in: projectIds } } }),
      prisma.docPage.aggregate({
        where: { projectId: { in: projectIds } },
        _sum: { viewCount: true },
      }),
      prisma.docPage.findMany({
        where: { projectId: { in: projectIds } },
        select: {
          id: true,
          title: true,
          slug: true,
          updatedAt: true,
          viewCount: true,
          published: true,
          projectId: true,
          project: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
    ]);

    const totalViewCount = totalViews._sum.viewCount || 0;

    const latestHealthReports = await prisma.healthReport.groupBy({
      by: ['projectId'],
      where: { projectId: { in: projectIds } },
      _max: { createdAt: true },
    });

    const healthReportIds = latestHealthReports.map((r) => ({
      projectId: r.projectId,
      createdAt: r._max.createdAt!,
    }));

    const latestReports = await Promise.all(
      healthReportIds.map((r) =>
        prisma.healthReport.findFirst({
          where: { projectId: r.projectId, createdAt: r.createdAt },
          select: { projectId: true, score: true },
        })
      )
    );

    const healthScoreMap = new Map<string, number>();
    for (const report of latestReports) {
      if (report) healthScoreMap.set(report.projectId, report.score);
    }

    const scores = Array.from(healthScoreMap.values());
    const avgHealthScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    const tierLimits = TIERS[tier];

    const data: DashboardData = {
      user: {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      },
      tier,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        published: p.published,
        pageCount: p._count.pages,
        updatedAt: p.updatedAt.toISOString(),
        healthScore: healthScoreMap.get(p.id) ?? null,
      })),
      stats: {
        projectCount: projects.length,
        pageCount: totalPages,
        publishedCount: publishedCount,
        totalViews: totalViewCount,
        avgHealthScore,
        memberCount,
      },
      recentPages: recentPages.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        updatedAt: p.updatedAt.toISOString(),
        viewCount: p.viewCount,
        published: p.published,
        projectId: p.projectId,
        projectName: p.project.name,
      })),
      limits: {
        maxProjects: Number.isFinite(tierLimits.maxProjects)
          ? tierLimits.maxProjects
          : -1,
        maxPages: Number.isFinite(tierLimits.maxPages)
          ? tierLimits.maxPages
          : -1,
        maxMembers: Number.isFinite(tierLimits.maxMembers)
          ? tierLimits.maxMembers
          : -1,
      },
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}
