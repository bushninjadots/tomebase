import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { requireAuth } from '@/lib/authorization';
import { scanPages } from '@/lib/diagnostics/engine';
import { getActiveProviderConfig, createProviderFromConfig } from '@/lib/workspace';
import type { DiagnosticPage } from '@fluid/types';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Get all projects for the user
    const team = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
      include: { team: { include: { projects: { include: { _count: { select: { pages: true } } } } } } },
    });

    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const projects = team.team.projects;

    // Gather health data for all projects
    const healthReports = await prisma.healthReport.groupBy({
      by: ['projectId'],
      where: { projectId: { in: projects.map((p) => p.id) } },
      _max: { createdAt: true },
    });

    const latestReports = await Promise.all(
      healthReports.map((r) =>
        prisma.healthReport.findFirst({
          where: { projectId: r.projectId, createdAt: r._max.createdAt! },
        }),
      ),
    );

    // Get recently fixed issues (from snapshots in last 7 days)
    const recentSnapshots = await prisma.pageSnapshot.findMany({
      where: {
        page: { projectId: { in: projects.map((p) => p.id) } },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: { page: { select: { title: true, projectId: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get stale pages
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const allPages = await prisma.docPage.findMany({
      where: { projectId: { in: projects.map((p) => p.id) }, updatedAt: { lt: thirtyDaysAgo } },
      select: { title: true, slug: true, updatedAt: true, projectId: true, project: { select: { name: true } } },
      orderBy: { updatedAt: 'asc' },
      take: 10,
    });

    // Get broken links count
    let totalBrokenLinks = 0;
    let totalIssues = 0;
    let avgScore = 0;

    if (latestReports.length > 0) {
      const scores = latestReports.filter(Boolean).map((r) => r!.score);
      avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      for (const report of latestReports) {
        if (report) {
          const issues = report.issues as Array<{ category: string }> || [];
          totalBrokenLinks += issues.filter((i) => i.category === 'broken_link').length;
          totalIssues += issues.length;
        }
      }
    }

    // Try AI insights if a provider is configured
    let aiInsights: Array<{ type: string; message: string; priority: string }> = [];
    const config = await getActiveProviderConfig(session.user.id);

    if (config && allPages.length > 0) {
      try {
        const provider = createProviderFromConfig(config);

        const staleSummary = allPages
          .slice(0, 5)
          .map((p) => `- "${p.title}" in "${p.project.name}" (last updated ${Math.floor((Date.now() - p.updatedAt.getTime()) / (1000 * 60 * 60 * 24))} days ago)`)
          .join('\n');

        const reviewResult = await provider.review({
          content: `Project: ${projects.map((p) => p.name).join(', ')}
Average health score: ${avgScore}/100
Total issues: ${totalIssues}
Broken links: ${totalBrokenLinks}

Stale pages:
${staleSummary}`,
          pageTitle: 'Dashboard Overview',
        });

        if (reviewResult.issues) {
          aiInsights = reviewResult.issues.map((issue) => ({
            type: issue.severity === 'error' ? 'issue' : issue.severity === 'warning' ? 'warning' : 'suggestion',
            message: issue.description + (issue.suggestion ? ` — ${issue.suggestion}` : ''),
            priority: issue.severity,
          }));
        }
      } catch {
        // AI insights are optional; fall back to rule-based
      }
    }

    // Build rule-based insights even without AI
    const ruleInsights: Array<{ type: string; message: string; priority: string }> = [];
    if (totalBrokenLinks > 0) ruleInsights.push({ type: 'issue', message: `${totalBrokenLinks} broken link${totalBrokenLinks === 1 ? '' : 's'} across your projects`, priority: 'high' });
    if (allPages.length > 0) ruleInsights.push({ type: 'warning', message: `${allPages.length} page${allPages.length === 1 ? '' : 's'} haven't been updated in 30+ days`, priority: 'medium' });
    if (recentSnapshots.length > 0) ruleInsights.push({ type: 'info', message: `${recentSnapshots.length} fix${recentSnapshots.length === 1 ? '' : 'es'} applied in the last 7 days`, priority: 'low' });
    if (projects.some((p) => p._count.pages === 0)) ruleInsights.push({ type: 'suggestion', message: 'Some projects have no pages yet — try importing code from your repository', priority: 'medium' });

    return NextResponse.json({
      projects: projects.length,
      totalPages: projects.reduce((s, p) => s + p._count.pages, 0),
      averageHealthScore: avgScore,
      totalIssues,
      totalBrokenLinks,
      stalePages: allPages.length,
      recentFixes: recentSnapshots.length,
      insights: [...ruleInsights, ...aiInsights].slice(0, 10),
      aiGenerated: aiInsights.length > 0,
    });
  } catch (error) {
    console.error('Dashboard insights error:', error);
    return NextResponse.json(
      { error: `Failed to get insights: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 },
    );
  }
}
