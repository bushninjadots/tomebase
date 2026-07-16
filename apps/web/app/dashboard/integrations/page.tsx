import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@fluid/database';
import { getOrCreatePersonalTeam } from '@/lib/team';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
  Github, Webhook, Key, Link2, CheckCircle, AlertCircle,
  ExternalLink, ArrowRight, Shield, Bell, Globe,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const team = await getOrCreatePersonalTeam(session.user.id);

  const [projects, accounts] = await Promise.all([
    prisma.project.findMany({
      where: { teamId: team.id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            apiKeys: true,
            webhooks: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true },
    }),
  ]);

  const connectedProviders = accounts.map((a) => a.provider);
  const hasGitHub = connectedProviders.includes('github');

  const totalApiKeys = projects.reduce((sum, p) => sum + p._count.apiKeys, 0);
  const totalWebhooks = projects.reduce((sum, p) => sum + p._count.webhooks, 0);

  return (
    <div className="min-h-screen bg-theme-page">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6">
          <Breadcrumbs items={[{ label: 'Integrations' }]} />
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-theme-main">Integrations</h1>
          <p className="mt-1 text-sm text-theme-muted">
            Connect your tools and services to TomeBase.
          </p>
        </div>

        {/* Connected Accounts */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-theme-main mb-3 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-theme-muted" />
            Connected Accounts
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* GitHub */}
            <div className="rounded-xl border border-theme-border bg-theme-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-theme-hover">
                    <Github className="h-5 w-5 text-theme-main" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-theme-main">GitHub</p>
                    <p className="text-xs text-theme-muted">
                      {hasGitHub ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                {hasGitHub ? (
                  <div className="flex items-center gap-1.5 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Active</span>
                  </div>
                ) : (
                  <Link
                    href="/dashboard/account"
                    className="text-xs font-medium text-theme-accent hover:text-theme-accent-hover transition-colors"
                  >
                    Connect
                  </Link>
                )}
              </div>
            </div>

            {/* Google */}
            <div className="rounded-xl border border-theme-border bg-theme-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-theme-hover">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-theme-main">Google</p>
                    <p className="text-xs text-theme-muted">
                      {connectedProviders.includes('google') ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                {connectedProviders.includes('google') ? (
                  <div className="flex items-center gap-1.5 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Active</span>
                  </div>
                ) : (
                  <Link
                    href="/dashboard/account"
                    className="text-xs font-medium text-theme-accent hover:text-theme-accent-hover transition-colors"
                  >
                    Connect
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Project Integrations */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-theme-main mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-theme-muted" />
            Project Integrations
          </h2>

          {projects.length === 0 ? (
            <div className="rounded-xl border border-theme-border bg-theme-card p-8 text-center">
              <p className="text-sm text-theme-muted">No projects yet. Create a project to set up integrations.</p>
              <Link
                href="/dashboard"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-theme-accent hover:text-theme-accent-hover transition-colors"
              >
                Go to Dashboard <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-xl border border-theme-border bg-theme-card p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-theme-main">{project.name}</h3>
                    <Link
                      href={`/dashboard/${project.id}/settings`}
                      className="text-xs font-medium text-theme-muted hover:text-theme-accent transition-colors flex items-center gap-1"
                    >
                      Settings <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {/* Git Sync */}
                    <Link
                      href={`/dashboard/${project.id}/settings`}
                      className="flex items-center gap-3 rounded-lg border border-theme-border bg-theme-page p-3 hover:border-theme-accent/30 transition-colors group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-hover group-hover:bg-theme-accent/10 transition-colors">
                        <Github className="h-4 w-4 text-theme-muted group-hover:text-theme-accent transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-theme-main">Git Sync</p>
                        <p className="text-[10px] text-theme-muted truncate">Import from GitHub</p>
                      </div>
                    </Link>

                    {/* Webhooks */}
                    <Link
                      href={`/dashboard/${project.id}/settings`}
                      className="flex items-center gap-3 rounded-lg border border-theme-border bg-theme-page p-3 hover:border-theme-accent/30 transition-colors group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-hover group-hover:bg-theme-accent/10 transition-colors">
                        <Webhook className="h-4 w-4 text-theme-muted group-hover:text-theme-accent transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-theme-main">Webhooks</p>
                        <p className="text-[10px] text-theme-muted">
                          {project._count.webhooks} configured
                        </p>
                      </div>
                    </Link>

                    {/* API Keys */}
                    <Link
                      href={`/dashboard/${project.id}/settings`}
                      className="flex items-center gap-3 rounded-lg border border-theme-border bg-theme-page p-3 hover:border-theme-accent/30 transition-colors group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-hover group-hover:bg-theme-accent/10 transition-colors">
                        <Key className="h-4 w-4 text-theme-muted group-hover:text-theme-accent transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-theme-main">API Keys</p>
                        <p className="text-[10px] text-theme-muted">
                          {project._count.apiKeys} active
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Summary Stats */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-theme-main mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-theme-muted" />
            Overview
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-theme-border bg-theme-card p-4">
              <p className="text-2xl font-bold text-theme-main">{projects.length}</p>
              <p className="text-xs text-theme-muted mt-1">Projects</p>
            </div>
            <div className="rounded-xl border border-theme-border bg-theme-card p-4">
              <p className="text-2xl font-bold text-theme-main">{totalWebhooks}</p>
              <p className="text-xs text-theme-muted mt-1">Webhooks</p>
            </div>
            <div className="rounded-xl border border-theme-border bg-theme-card p-4">
              <p className="text-2xl font-bold text-theme-main">{totalApiKeys}</p>
              <p className="text-xs text-theme-muted mt-1">API Keys</p>
            </div>
          </div>
        </section>

        {/* Coming Soon */}
        <section>
          <h2 className="text-sm font-semibold text-theme-main mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-theme-muted" />
            Coming Soon
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { name: 'Slack', desc: 'Post updates to Slack channels' },
              { name: 'Notion', desc: 'Import from Notion workspaces' },
              { name: 'Linear', desc: 'Link issues to documentation' },
              { name: 'Figma', desc: 'Embed design files' },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-xl border border-theme-border bg-theme-card p-4 opacity-60"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-hover">
                  <span className="text-xs font-bold text-theme-muted">{item.name[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-theme-main">{item.name}</p>
                  <p className="text-xs text-theme-muted">{item.desc}</p>
                </div>
                <span className="ml-auto rounded-full bg-theme-hover px-2 py-0.5 text-[10px] font-medium text-theme-muted">
                  Soon
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
