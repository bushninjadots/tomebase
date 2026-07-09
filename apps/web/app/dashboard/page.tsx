import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@fluid/database';
import Link from 'next/link';
import { Plus, BookOpen, Users, FileText, Globe, Clock, ArrowRight, Zap, Eye } from 'lucide-react';
import { getOrCreatePersonalTeam } from '@/lib/team';
import { TIERS } from '@/lib/limits';
import { ProjectCard } from '@/components/project-card';
import { UsageMeter } from '@/components/usage-meter';
import { OnboardingChecklist } from '@/components/onboarding-checklist';

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
      select: { id: true, title: true, slug: true, updatedAt: true, viewCount: true, projectId: true, project: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
  ]);

  const totalViewCount = totalViews._sum.viewCount || 0;

  const topPages = await prisma.docPage.findMany({
    where: { projectId: { in: projectIds } },
    select: { id: true, title: true, slug: true, viewCount: true, projectId: true, project: { select: { name: true } } },
    orderBy: { viewCount: 'desc' },
    take: 5,
  });

  const stats = [
    { label: 'Total Pages', value: totalPages, icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { label: 'Published', value: publishedCount, icon: Globe, color: 'text-green-600 bg-green-50' },
    { label: 'Page Views', value: totalViewCount, icon: Eye, color: 'text-violet-600 bg-violet-50' },
    { label: 'Projects', value: projects.length, icon: BookOpen, color: 'text-purple-600 bg-purple-50' },
    { label: 'Team Members', value: memberCount, icon: Users, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="#0c8ee7" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              <span className="text-base font-bold tracking-tight">Fluid</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                <Users className="h-4 w-4" />
                Team
              </Link>
              <form
                action={async () => {
                  'use server';
                  const { signOut } = await import('@/lib/auth');
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </span>
              <span className="rounded-full bg-fluid-50 px-2.5 py-0.5 text-xs font-medium text-fluid-700 capitalize">
                {tier}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {tier === 'free' && (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 rounded-lg border border-fluid-200 px-3 py-1.5 text-sm font-medium text-fluid-700 hover:bg-fluid-50 transition-colors"
              >
                <Zap className="h-3.5 w-3.5" />
                Upgrade
              </Link>
            )}
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
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

        <div className="mb-8 grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-100 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
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

        {recentPages.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Recently Updated</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/docs/${page.projectId}/${page.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 transition-all hover:border-fluid-200 hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 group-hover:text-fluid-600 transition-colors">
                      {page.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {page.project.name}
                      {page.viewCount > 0 && ` · ${page.viewCount} view${page.viewCount !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <ArrowRight className="ml-3 h-4 w-4 shrink-0 text-gray-300 group-hover:text-fluid-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {topPages.length > 0 && totalViewCount > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Most Viewed</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topPages.map((page, i) => (
                <Link
                  key={page.id}
                  href={`/docs/${page.projectId}/${page.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 transition-all hover:border-fluid-200 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 text-[11px] font-bold text-gray-500">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 group-hover:text-fluid-600 transition-colors">
                        {page.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {page.project.name}
                      </p>
                    </div>
                  </div>
                  <span className="ml-3 shrink-0 text-xs font-medium text-gray-500">
                    {page.viewCount} view{page.viewCount !== 1 ? 's' : ''}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-fluid-50">
              <BookOpen className="h-8 w-8 text-fluid-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Welcome to Fluid</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Document your APIs, products, and internal tools. Start by creating your first project.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3 text-left max-w-lg mx-auto">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fluid-600 text-white text-xs font-bold mb-2">1</div>
                <h3 className="text-sm font-medium text-gray-900">Create a Project</h3>
                <p className="mt-1 text-xs text-gray-500">Name your documentation project</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fluid-600 text-white text-xs font-bold mb-2">2</div>
                <h3 className="text-sm font-medium text-gray-900">Write Pages</h3>
                <p className="mt-1 text-xs text-gray-500">Add docs with Markdown or templates</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fluid-600 text-white text-xs font-bold mb-2">3</div>
                <h3 className="text-sm font-medium text-gray-900">Publish & Share</h3>
                <p className="mt-1 text-xs text-gray-500">Go live with a public link</p>
              </div>
            </div>
            <Link
              href="/dashboard/new"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-4">All Projects</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  slug={project.slug}
                  description={project.description}
                  published={project.published}
                  pageCount={project._count.pages}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
