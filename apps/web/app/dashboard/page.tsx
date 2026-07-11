import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@fluid/database';
import Link from 'next/link';
import {
  Plus,
  BookOpen,
  FileText,
  Globe,
  Clock,
  ArrowRight,
  Eye,
  AlertTriangle,
  GitBranch,
  Activity,
  Network,
  Zap,
} from 'lucide-react';
import { getOrCreatePersonalTeam } from '@/lib/team';
import { TIERS } from '@/lib/limits';
import { ProjectCard } from '@/components/project-card';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const team = await getOrCreatePersonalTeam(session.user.id);
  const tier = (team.tier || 'free') as keyof typeof TIERS;

  const projects = await prisma.project.findMany({
    where: { teamId: team.id },
    include: { _count: { select: { pages: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  const projectIds = projects.map((p) => p.id);

  const [memberCount, publishedCount, totalPages, totalViews, recentPages] = await Promise.all([
    prisma.teamMember.count({ where: { teamId: team.id } }),
    prisma.docPage.count({ where: { projectId: { in: projectIds }, published: true } }),
    prisma.docPage.count({ where: { projectId: { in: projectIds } } }),
    prisma.docPage.aggregate({ where: { projectId: { in: projectIds } }, _sum: { viewCount: true } }),
    prisma.docPage.findMany({
      where: { projectId: { in: projectIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        updatedAt: true,
        viewCount: true,
        content: true,
        projectId: true,
        project: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
  ]);

  const totalViewCount = totalViews._sum.viewCount || 0;

  // Latest health report per project
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
  const avgHealthScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  function getProgressColor(current: number, limit: number) {
    if (!Number.isFinite(limit)) return 'bg-blue-500';
    const pct = Math.round((current / limit) * 100);
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 80) return 'bg-orange-400';
    return 'bg-blue-500';
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Section A — Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Pages */}
        <div className="bg-theme-card border border-theme-border rounded-[14px] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <FileText className="h-4.5 w-4.5 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-theme-main mb-0.5">{totalPages}</p>
          <p className="text-xs text-theme-muted mb-4">Total Pages</p>
          <Link
            href="/dashboard/pages"
            className="mt-auto text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            View pages
          </Link>
        </div>

        {/* Published */}
        <div className="bg-theme-card border border-theme-border rounded-[14px] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Globe className="h-4.5 w-4.5 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-theme-main mb-0.5">{publishedCount}</p>
          <p className="text-xs text-theme-muted mb-4">Published</p>
          <Link
            href="/dashboard/pages?filter=published"
            className="mt-auto text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            See docs
          </Link>
        </div>

        {/* Page Views */}
        <div className="bg-theme-card border border-theme-border rounded-[14px] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-full bg-violet-500/15 flex items-center justify-center">
              <Eye className="h-4.5 w-4.5 text-violet-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-theme-main mb-0.5">{totalViewCount.toLocaleString()}</p>
          <p className="text-xs text-theme-muted mb-4">Page Views</p>
          <Link
            href="/dashboard/analytics"
            className="mt-auto text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
          >
            Health scan
          </Link>
        </div>

        {/* Health Score */}
        <div className="bg-theme-card border border-theme-border rounded-[14px] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center">
              <AlertTriangle className="h-4.5 w-4.5 text-orange-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-theme-main mb-0.5">{avgHealthScore}/100</p>
          <p className="text-xs text-theme-muted mb-4">Health Score</p>
          <Link
            href="/dashboard/health"
            className="mt-auto text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
          >
            Improve →
          </Link>
        </div>
      </div>

      {/* Section B — Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/dashboard/import"
          className="bg-theme-card border border-theme-border rounded-[14px] p-5 flex items-center gap-4 hover:border-theme-accent/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <GitBranch className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-theme-main group-hover:text-theme-accent transition-colors">
              Import from Code
            </p>
            <p className="text-xs text-theme-muted mt-0.5">Sync docs from your repository</p>
          </div>
        </Link>

        <Link
          href="/dashboard/health"
          className="bg-theme-card border border-theme-border rounded-[14px] p-5 flex items-center gap-4 hover:border-theme-accent/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <Activity className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-theme-main group-hover:text-theme-accent transition-colors">
              Run Health Scan
            </p>
            <p className="text-xs text-theme-muted mt-0.5">Check docs quality &amp; coverage</p>
          </div>
        </Link>

        <Link
          href="/dashboard/graph"
          className="bg-theme-card border border-theme-border rounded-[14px] p-5 flex items-center gap-4 hover:border-theme-accent/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Network className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-theme-main group-hover:text-theme-accent transition-colors">
              Graph View
            </p>
            <p className="text-xs text-theme-muted mt-0.5">Visualize page connections</p>
          </div>
        </Link>
      </div>

      {/* Section C — Recently Updated */}
      {recentPages.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-theme-main">Recently Updated</h2>
            <Link
              href="/dashboard/pages"
              className="text-xs font-medium text-theme-muted hover:text-theme-accent transition-colors flex items-center gap-1"
            >
              View all pages <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentPages.map((page) => (
              <Link
                key={page.id}
                href={`/docs/${page.projectId}/${page.slug}`}
                className="bg-theme-card border border-theme-border rounded-[14px] px-4 py-3.5 flex items-center justify-between hover:border-theme-accent/30 transition-all group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-theme-main truncate group-hover:text-theme-accent transition-colors">
                    {page.title}
                  </p>
                  <p className="text-xs text-theme-muted mt-0.5">
                    Updated {new Date(page.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {page.content ? ` · ${page.content.split(/\s+/).filter(Boolean).length.toLocaleString()} words` : ''}
                  </p>
                </div>
                <ArrowRight className="ml-3 h-4 w-4 shrink-0 text-theme-border group-hover:text-theme-accent transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Section D — Bottom Two-Column Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Free Plan */}
        <div className="bg-theme-card border border-theme-border rounded-[14px] p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-theme-main">{tier === 'pro' ? 'Pro Plan' : 'Free Plan'}</h3>
            {tier === 'free' && (
              <Link
                href="/pricing"
                className="text-xs font-medium text-theme-accent hover:text-theme-accent-hover transition-colors flex items-center gap-1"
              >
                Upgrade <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <div className="space-y-4">
            {/* Projects */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-theme-subtle">Projects</span>
                <span className={projects.length >= TIERS[tier].maxProjects ? 'text-red-400 font-medium' : 'text-theme-muted'}>
                  {projects.length}/{Number.isFinite(TIERS[tier].maxProjects) ? TIERS[tier].maxProjects : '∞'}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-theme-hover overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(projects.length, TIERS[tier].maxProjects)}`}
                  style={{ width: `${Number.isFinite(TIERS[tier].maxProjects) ? Math.min(100, (projects.length / TIERS[tier].maxProjects) * 100) : 0}%` }}
                />
              </div>
            </div>
            {/* Pages */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-theme-subtle">Pages</span>
                <span className="text-theme-muted">{totalPages}/{Number.isFinite(TIERS[tier].maxPages) ? TIERS[tier].maxPages : '∞'}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-theme-hover overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(totalPages, TIERS[tier].maxPages)}`}
                  style={{ width: `${Number.isFinite(TIERS[tier].maxPages) ? Math.min(100, (totalPages / TIERS[tier].maxPages) * 100) : 0}%` }}
                />
              </div>
            </div>
            {/* Members */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-theme-subtle">Members</span>
                <span className={memberCount >= TIERS[tier].maxMembers ? 'text-red-400 font-medium' : 'text-theme-muted'}>
                  {memberCount}/{Number.isFinite(TIERS[tier].maxMembers) ? TIERS[tier].maxMembers : '∞'}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-theme-hover overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(memberCount, TIERS[tier].maxMembers)}`}
                  style={{ width: `${Number.isFinite(TIERS[tier].maxMembers) ? Math.min(100, (memberCount / TIERS[tier].maxMembers) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: All Projects */}
        <div className="bg-theme-card border border-theme-border rounded-[14px] p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-theme-main">All Projects</h3>
            <Link
              href="/dashboard/new"
              className="text-xs font-medium text-theme-accent hover:text-theme-accent-hover transition-colors flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> New Project
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-theme-accent-light">
                <BookOpen className="h-6 w-6 text-theme-accent" />
              </div>
              <p className="text-sm text-theme-muted">No projects yet</p>
              <Link
                href="/dashboard/new"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-theme-accent hover:text-theme-accent-hover transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Create your first project
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  slug={project.slug}
                  published={project.published}
                  pageCount={project._count.pages}
                  updatedAt={project.updatedAt}
                  healthScore={healthScoreMap.get(project.id) ?? null}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
