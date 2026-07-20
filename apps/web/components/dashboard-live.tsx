'use client';

import Link from 'next/link';
import {
  Plus,
  BookOpen,
  FileText,
  Globe,
  ArrowRight,
  Eye,
  Activity,
  Network,
  GitBranch,
  ArrowUpRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useDashboardLive } from '@/lib/hooks/use-dashboard-live';
import { ProjectCard } from '@/components/project-card';
import { UpgradeBanner } from '@/components/upgrade-banner';
import { UpgradePrompt } from '@/components/upgrade-prompt';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { DashboardInsights } from '@/components/dashboard-insights';

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

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-64 rounded bg-theme-hover mb-2" />
      <div className="h-4 w-96 rounded bg-theme-hover mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-theme-border bg-theme-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl border border-theme-border bg-theme-card" />
        ))}
      </div>
      <div className="space-y-2 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-theme-hover" />
        ))}
      </div>
    </div>
  );
}

export function DashboardLive() {
  const { data, loading, error } = useDashboardLive();

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <UpgradeBanner />
        <div className="mb-6">
          <Breadcrumbs items={[]} />
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Breadcrumbs items={[]} />
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm font-medium text-theme-main">Failed to load dashboard</p>
          <p className="text-xs text-theme-muted mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const firstName = data.user.name?.split(' ')[0] || 'there';
  const firstProjectId = data.projects[0]?.id;
  const firstPublishedProject = data.projects.find((p) => p.published);
  const { stats, projects, recentPages, tier, limits } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <UpgradeBanner />

      {tier === 'free' && (
        <div className="mb-6">
          <UpgradePrompt />
        </div>
      )}

      <div className="mb-6">
        <Breadcrumbs items={[]} />
      </div>

      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-theme-main">
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-theme-muted">
          {stats.projectCount} project{stats.projectCount === 1 ? '' : 's'} ·{' '}
          {stats.publishedCount} published page{stats.publishedCount === 1 ? '' : 's'}
          {stats.avgHealthScore > 0 && (
            <>
              · Health score{' '}
              <span className="font-medium text-theme-main">{stats.avgHealthScore}</span>
            </>
          )}
          {loading && (
            <Loader2 className="inline h-3 w-3 ml-1.5 animate-spin text-theme-muted" />
          )}
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
          <p className="text-3xl font-bold text-theme-main tracking-tight">{stats.pageCount}</p>
          <p className="text-xs text-theme-muted mt-1">Pages</p>
        </Link>

        <Link
          href={
            firstPublishedProject
              ? `/p/${firstPublishedProject.id}`
              : firstProjectId
                ? `/dashboard/${firstProjectId}/settings`
                : '/dashboard/new'
          }
          className="group rounded-xl border border-theme-border p-4 hover:border-theme-accent/30 transition-all"
          style={{ background: 'color-mix(in srgb, var(--color-green-500) 4%, transparent)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-green-400" />
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-theme-border group-hover:text-theme-accent transition-colors" />
          </div>
          <p className="text-3xl font-bold text-theme-main tracking-tight">
            {stats.publishedCount}
          </p>
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
          <p className="text-3xl font-bold text-theme-main tracking-tight">
            {stats.totalViews.toLocaleString()}
          </p>
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
          <p className="text-3xl font-bold text-theme-main tracking-tight">
            {stats.avgHealthScore}
            <span className="text-lg text-theme-muted">/100</span>
          </p>
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
            <p className="text-sm font-semibold text-theme-main group-hover:text-theme-accent transition-colors">
              Import Code
            </p>
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
            <p className="text-sm font-semibold text-theme-main group-hover:text-theme-accent transition-colors">
              Health Scan
            </p>
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
            <p className="text-sm font-semibold text-theme-main group-hover:text-theme-accent transition-colors">
              Graph View
            </p>
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
                    <span className="truncate">{page.projectName}</span>
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

      {/* AI Insights */}
      <div className="mb-8">
        <DashboardInsights />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Usage — 2 cols */}
        <div className="lg:col-span-2 bg-theme-card border border-theme-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-theme-main">
              {tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
            </h3>
            {tier === 'free' && (
              <Link
                href="/pricing"
                className="text-xs font-medium text-theme-accent hover:text-theme-accent-hover transition-colors"
              >
                Upgrade
              </Link>
            )}
          </div>
          <div className="space-y-3.5">
            <UsageRow
              label="Projects"
              current={stats.projectCount}
              limit={limits.maxProjects}
            />
            <UsageRow label="Pages" current={stats.pageCount} limit={limits.maxPages} />
            <UsageRow
              label="Members"
              current={stats.memberCount}
              limit={limits.maxMembers}
            />
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
                  pageCount={project.pageCount}
                  updatedAt={new Date(project.updatedAt)}
                  healthScore={project.healthScore}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsageRow({
  label,
  current,
  limit,
}: {
  label: string;
  current: number;
  limit: number;
}) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((current / limit) * 100));
  const isWarning = !isUnlimited && pct >= 80;
  const isDanger = !isUnlimited && pct >= 100;

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-theme-subtle">{label}</span>
        <span
          className={
            isDanger
              ? 'text-red-400 font-medium'
              : isWarning
                ? 'text-amber-400 font-medium'
                : 'text-theme-muted'
          }
        >
          {current}/{isUnlimited ? '∞' : limit}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-theme-hover overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-theme-accent'
          }`}
          style={{ width: isUnlimited ? '0%' : `${pct}%` }}
        />
      </div>
    </div>
  );
}
