import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@fluid/database';
import Link from 'next/link';
import { Suspense } from 'react';
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
  ArrowUpRight,
} from 'lucide-react';
import { getOrCreatePersonalTeam } from '@/lib/team';
import { TIERS } from '@/lib/limits';
import { ProjectCard } from '@/components/project-card';
import { UpgradeBanner } from '@/components/upgrade-banner';
import { UpgradePrompt } from '@/components/upgrade-prompt';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userExists = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
  if (!userExists) redirect('/login');

  let team;
  try {
    team = await getOrCreatePersonalTeam(session.user.id, session.user.name);
  } catch (e) {
    console.error('Dashboard: failed to get/create team:', e);
    redirect('/login');
  }
  const tier = (team.tier || 'free') as keyof typeof TIERS;
  const firstName = session.user.name?.split(' ')[0] || 'there';

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
        published: true,
        projectId: true,
        project: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
  ]);

  const totalViewCount = totalViews._sum.viewCount || 0;
  const firstProjectId = projects[0]?.id;
  const firstPublishedProject = projects.find((p) => p.published);

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

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <Suspense>
        <UpgradeBanner />
      </Suspense>

      {tier === 'free' && (
        <div className="mb-6">
          <UpgradePrompt />
        </div>
      )}

      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-theme-main">{getGreeting()}, {firstName}</h1>
        <p className="mt-1 text-sm text-theme-muted">
          {projects.length} project{projects.length === 1 ? '' : 's'} · {publishedCount} published page{publishedCount === 1 ? '' : 's'}
          {avgHealthScore > 0 && <> · Health score <span className="font-medium text-theme-main">{avgHealthScore}</span></>}
        </p>
        {firstProjectId && (
          <Link
            href={`/docs/${firstProjectId}`}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-theme-accent hover:text-theme-accent-hover transition-colors"
          >
            Continue editing <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Link
          href={firstProjectId ? `/docs/${firstProjectId}` : '/dashboard/new'}
          className="group rounded-xl border border-theme-border p-4 hover:border-theme-accent/30 transition-all"
          style={{ background: 'color-mix(in srgb, var(--color-blue-500) 4%, transparent)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-400" />
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-theme-border group-hover:text-theme-accent transition-colors" />
          </div>
          <p className="text-3xl font-bold text-theme-main tracking-tight">{totalPages}</p>
          <p className="text-xs text-theme-muted mt-1">Pages</p>
        </Link>

        <Link
          href={firstPublishedProject ? `/p/${firstPublishedProject.id}` : (firstProjectId ? `/dashboard/${firstProjectId}/settings` : '/dashboard/new')}
          className="group rounded-xl border border-theme-border p-4 hover:border-theme-accent/30 transition-all"
          style={{ background: 'color-mix(in srgb, var(--color-green-500) 4%, transparent)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-green-400" />
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-theme-border group-hover:text-theme-accent transition-colors" />
          </div>
          <p className="text-3xl font-bold text-theme-main tracking-tight">{publishedCount}</p>
          <p className="text-xs text-theme-muted mt-1">Published</p>
        </Link>

        <div
          className="rounded-xl border border-theme-border p-4"
          style={{ background: 'color-mix(in srgb, var(--color-amber-500) 4%, transparent)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Eye className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-theme-main tracking-tight">{totalViewCount.toLocaleString()}</p>
          <p className="text-xs text-theme-muted mt-1">Views</p>
        </div>

        <Link
          href={firstProjectId ? `/dashboard/${firstProjectId}/health` : '/dashboard/new'}
          className="group rounded-xl border border-theme-border p-4 hover:border-theme-accent/30 transition-all"
          style={{ background: 'color-mix(in srgb, var(--color-purple-500) 4%, transparent)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-purple-400" />
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-theme-border group-hover:text-theme-accent transition-colors" />
          </div>
          <p className="text-3xl font-bold text-theme-main tracking-tight">{avgHealthScore}<span className="text-lg text-theme-muted">/100</span></p>
          <p className="text-xs text-theme-muted mt-1">Health</p>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <Link
          href={firstProjectId ? `/dashboard/${firstProjectId}/import` : '/dashboard/new'}
          className="group flex items-center gap-3 rounded-xl border border-theme-border bg-theme-card p-4 hover:border-theme-accent/30 hover:bg-theme-hover transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-theme-accent/10 flex items-center justify-center shrink-0 group-hover:bg-theme-accent/20 transition-colors">
            <GitBranch className="h-4 w-4 text-theme-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-theme-main group-hover:text-theme-accent transition-colors">Import Code</p>
            <p className="text-xs text-theme-muted truncate">9 languages + OpenAPI</p>
          </div>
        </Link>

        <Link
          href={firstProjectId ? `/dashboard/${firstProjectId}/health` : '/dashboard/new'}
          className="group flex items-center gap-3 rounded-xl border border-theme-border bg-theme-card p-4 hover:border-theme-accent/30 hover:bg-theme-hover transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-theme-main group-hover:text-theme-accent transition-colors">Health Scan</p>
            <p className="text-xs text-theme-muted truncate">12 quality checks</p>
          </div>
        </Link>

        <Link
          href={firstProjectId ? `/docs/${firstProjectId}` : '/dashboard/new'}
          className="group flex items-center gap-3 rounded-xl border border-theme-border bg-theme-card p-4 hover:border-theme-accent/30 hover:bg-theme-hover transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 group-hover:bg-green-500/20 transition-colors">
            <Network className="h-4 w-4 text-green-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-theme-main group-hover:text-theme-accent transition-colors">Graph View</p>
            <p className="text-xs text-theme-muted truncate">Visualize connections</p>
          </div>
        </Link>
      </div>

      {/* Recently Updated */}
      {recentPages.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-theme-main">Recently Updated</h2>
            <Link
              href={firstProjectId ? `/docs/${firstProjectId}` : '/dashboard/new'}
              className="text-xs font-medium text-theme-muted hover:text-theme-accent transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {recentPages.map((page) => (
              <Link
                key={page.id}
                href={`/docs/${page.projectId}/${page.slug}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-theme-hover transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-theme-card border border-theme-border flex items-center justify-center shrink-0">
                  <FileText className="h-3.5 w-3.5 text-theme-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-theme-main truncate group-hover:text-theme-accent transition-colors">
                      {page.title}
                    </p>
                    {page.published && (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
                        <Globe className="h-2.5 w-2.5" /> Live
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-theme-muted mt-0.5 flex items-center gap-1.5">
                    <span className="truncate">{page.project.name}</span>
                    <span className="text-theme-border">·</span>
                    <span className="shrink-0">{timeAgo(new Date(page.updatedAt))}</span>
                  </p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-theme-border group-hover:text-theme-accent transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Usage — 2 cols */}
        <div className="lg:col-span-2 bg-theme-card border border-theme-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-theme-main">
              {tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
            </h3>
            {tier === 'free' && (
              <Link href="/pricing" className="text-xs font-medium text-theme-accent hover:text-theme-accent-hover transition-colors">
                Upgrade
              </Link>
            )}
          </div>
          <div className="space-y-3.5">
            <UsageRow label="Projects" current={projects.length} limit={TIERS[tier].maxProjects} />
            <UsageRow label="Pages" current={totalPages} limit={TIERS[tier].maxPages} />
            <UsageRow label="Members" current={memberCount} limit={TIERS[tier].maxMembers} />
          </div>
        </div>

        {/* Projects — 3 cols */}
        <div className="lg:col-span-3 bg-theme-card border border-theme-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-theme-main">Projects</h3>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-1 rounded-lg bg-theme-accent px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-theme-accent-hover transition-colors"
            >
              <Plus className="h-3 w-3" /> New
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-theme-accent-light">
                <BookOpen className="h-5 w-5 text-theme-accent" />
              </div>
              <p className="text-sm text-theme-muted">No projects yet</p>
              <Link
                href="/dashboard/new"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-theme-accent hover:text-theme-accent-hover transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Create your first project
              </Link>
            </div>
          ) : (
            <div className="space-y-0.5">
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

function UsageRow({ label, current, limit }: { label: string; current: number; limit: number }) {
  const isUnlimited = !Number.isFinite(limit);
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((current / limit) * 100));
  const isWarning = !isUnlimited && pct >= 80;
  const isDanger = !isUnlimited && pct >= 100;

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-theme-subtle">{label}</span>
        <span className={isDanger ? 'text-red-400 font-medium' : isWarning ? 'text-amber-400 font-medium' : 'text-theme-muted'}>
          {current}/{isUnlimited ? '∞' : limit}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-theme-hover overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-theme-accent'}`}
          style={{ width: isUnlimited ? '0%' : `${pct}%` }}
        />
      </div>
    </div>
  );
}
