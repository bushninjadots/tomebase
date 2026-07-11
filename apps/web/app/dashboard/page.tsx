import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@fluid/database';
import Link from 'next/link';
import {
  Plus,
  BookOpen,
  Users,
  FileText,
  Globe,
  Clock,
  ArrowRight,
  Zap,
  Eye,
  Bookmark,
  MessageSquare,
  LayoutGrid,
} from 'lucide-react';
import { getOrCreatePersonalTeam } from '@/lib/team';
import { TIERS } from '@/lib/limits';
import { ProjectCard } from '@/components/project-card';
import { UsageMeter } from '@/components/usage-meter';
import { OnboardingChecklist } from '@/components/onboarding-checklist';
import { GuidedTutorial } from '@/components/guided-tutorial';
import { WelcomeHelp } from '@/components/welcome-help';
import { formatDistanceToNow } from 'date-fns';

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
        projectId: true,
        project: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
  ]);

  const recentComments =
    projectIds.length > 0
      ? await prisma.comment.findMany({
          where: { page: { projectId: { in: projectIds } } },
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { name: true, image: true } },
            page: {
              select: {
                id: true,
                title: true,
                slug: true,
                projectId: true,
                project: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        })
      : [];

  const totalViewCount = totalViews._sum.viewCount || 0;

  const topPages = await prisma.docPage.findMany({
    where: { projectId: { in: projectIds } },
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
      projectId: true,
      project: { select: { name: true } },
    },
    orderBy: { viewCount: 'desc' },
    take: 5,
  });

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      page: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          projectId: true,
          updatedAt: true,
          project: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });
  const bookmarkedPages = bookmarks.map((b) => b.page);

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

  const stats = [
    { label: 'Total Pages', value: totalPages, icon: FileText, color: 'text-blue-400 bg-blue-500/15' },
    { label: 'Published', value: publishedCount, icon: Globe, color: 'text-emerald-400 bg-emerald-500/15' },
    { label: 'Page Views', value: totalViewCount, icon: Eye, color: 'text-violet-400 bg-violet-500/15' },
    { label: 'Projects', value: projects.length, icon: LayoutGrid, color: 'text-theme-accent bg-theme-accent-light' },
    { label: 'Team Members', value: memberCount, icon: Users, color: 'text-amber-400 bg-amber-500/15' },
  ];

  return (
    <>
      <GuidedTutorial projectId={projects[0]?.id} />
      <WelcomeHelp />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Welcome Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name ?? ''}
                className="h-10 w-10 rounded-full ring-2 ring-theme-border"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-theme-accent-light text-sm font-bold text-theme-accent">
                {session.user.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-theme-main">
                Welcome back{session.user.name ? `, ${session.user.name}` : ''}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-theme-muted">{team.name}</span>
                <span className="text-theme-muted">·</span>
                <span className="text-sm text-theme-muted">
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}
                </span>
                <span className="text-theme-muted">·</span>
                <span className="inline-flex items-center rounded-full bg-theme-hover px-2 py-0.5 text-xs font-medium text-theme-subtle capitalize">
                  {tier}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {tier === 'free' && (
              <Link
                href="/pricing"
                className="btn-secondary !py-2 !px-3.5 !text-sm !gap-1.5"
              >
                <Zap className="h-3.5 w-3.5" />
                Upgrade
              </Link>
            )}
            <Link href="/dashboard/new" className="btn-primary !py-2 !px-4 !text-sm">
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </div>
        </div>

        <OnboardingChecklist
          hasProject={projects.length > 0}
          hasContent={totalPages > 0}
          hasPublished={publishedCount > 0}
          hasTeamMember={memberCount >= 2}
          projectId={projects[0]?.id}
        />

        {/* Stats + Usage */}
        <div className="mb-8 grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-theme-border bg-theme-card p-4 flex items-center gap-3"
              >
                <div className={`rounded-xl p-2.5 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-theme-main">{stat.value}</p>
                  <p className="text-xs text-theme-muted">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
          <UsageMeter
            tier={tier}
            projects={{ current: projects.length, limit: TIERS[tier].maxProjects }}
            pages={{ current: totalPages, limit: TIERS[tier].maxPages }}
            members={{ current: memberCount, limit: TIERS[tier].maxMembers }}
          />
        </div>

        {/* Recently Updated Pages */}
        {recentPages.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-theme-muted" />
              <h2 className="text-sm font-semibold text-theme-main">Recently Updated</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {recentPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/docs/${page.projectId}/${page.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-theme-border bg-theme-card px-4 py-3 transition-all hover:border-theme-accent/40 hover:bg-theme-hover"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-theme-main group-hover:text-theme-accent transition-colors">
                      {page.title}
                    </p>
                    <p className="text-xs text-theme-muted">
                      {page.project.name}
                      {page.viewCount > 0 &&
                        ` · ${page.viewCount} view${page.viewCount !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <ArrowRight className="ml-3 h-4 w-4 shrink-0 text-theme-border group-hover:text-theme-accent transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bookmarked Pages */}
        {bookmarkedPages.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Bookmark className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-theme-main">Bookmarked</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {bookmarkedPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/docs/${page.projectId}/${page.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-theme-border bg-theme-card px-4 py-3 transition-all hover:border-amber-500/30 hover:bg-theme-hover"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-theme-main group-hover:text-amber-400 transition-colors">
                      {page.title}
                    </p>
                    <p className="text-xs text-theme-muted">{page.project.name}</p>
                  </div>
                  <ArrowRight className="ml-3 h-4 w-4 shrink-0 text-theme-border group-hover:text-amber-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Most Viewed Pages */}
        {topPages.length > 0 && totalViewCount > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-theme-muted" />
              <h2 className="text-sm font-semibold text-theme-main">Most Viewed</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {topPages.map((page, i) => (
                <Link
                  key={page.id}
                  href={`/docs/${page.projectId}/${page.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-theme-border bg-theme-card px-4 py-3 transition-all hover:border-theme-accent/40 hover:bg-theme-hover"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-theme-hover text-[11px] font-bold text-theme-subtle">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-theme-main group-hover:text-theme-accent transition-colors">
                        {page.title}
                      </p>
                      <p className="text-xs text-theme-muted">{page.project.name}</p>
                    </div>
                  </div>
                  <span className="ml-3 shrink-0 text-xs font-medium text-theme-subtle">
                    {page.viewCount} view{page.viewCount !== 1 ? 's' : ''}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentComments.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-theme-muted" />
              <h2 className="text-sm font-semibold text-theme-main">Recent Activity</h2>
            </div>
            <div className="space-y-2">
              {recentComments.map((comment) => (
                <Link
                  key={comment.id}
                  href={`/docs/${comment.page.projectId}/${comment.page.slug}`}
                  className="flex items-start gap-3 rounded-xl border border-theme-border bg-theme-card px-4 py-3 transition-all hover:border-theme-accent/40 hover:bg-theme-hover"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-theme-hover text-xs font-medium text-theme-subtle">
                    {comment.user.image ? (
                      <img
                        src={comment.user.image}
                        alt=""
                        className="h-7 w-7 rounded-full"
                      />
                    ) : (
                      comment.user.name?.charAt(0)?.toUpperCase() ?? '?'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-theme-main">
                      <span className="font-medium">{comment.user.name ?? 'Someone'}</span>{' '}
                      commented on{' '}
                      <span className="font-medium">{comment.page.title}</span>
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-theme-subtle">
                      {comment.content}
                    </p>
                    <p className="mt-0.5 text-xs text-theme-muted">
                      {comment.page.project.name} ·{' '}
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-theme-border bg-theme-card p-16 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-theme-accent-light">
              <BookOpen className="h-8 w-8 text-theme-accent" />
            </div>
            <h2 className="text-xl font-bold text-theme-main">Welcome to TomeBase</h2>
            <p className="mt-2 text-sm text-theme-subtle max-w-md mx-auto leading-relaxed">
              Document your APIs, products, and internal tools. Start by creating your first
              project.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-4 text-left max-w-2xl mx-auto">
              {[
                { step: '1', title: 'Create a Project', desc: 'Pick a template or start blank' },
                { step: '2', title: 'Write or Import', desc: 'Use Markdown or import from code' },
                { step: '3', title: 'Connect Pages', desc: 'Use [[wiki links]] and the graph' },
                { step: '4', title: 'Publish & Share', desc: 'Go live with a public link' },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-xl border border-theme-border bg-theme-page p-4"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-accent text-[11px] font-bold text-white mb-2">
                    {item.step}
                  </div>
                  <h3 className="text-sm font-medium text-theme-main">{item.title}</h3>
                  <p className="mt-0.5 text-xs text-theme-muted">{item.desc}</p>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/new"
              className="mt-8 btn-primary"
            >
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-theme-main">All Projects</h2>
              <span className="text-xs text-theme-muted">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  slug={project.slug}
                  description={project.description}
                  published={project.published}
                  pageCount={project._count.pages}
                  memberCount={memberCount}
                  healthScore={healthScoreMap.get(project.id) ?? null}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
