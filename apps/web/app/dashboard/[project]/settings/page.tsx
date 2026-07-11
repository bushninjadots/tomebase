import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import Link from 'next/link';
import { Download, Github } from 'lucide-react';
import { ProjectSettingsForm } from './form';
import { ApiKeyManager } from './api-keys';
import { WebhookSettings } from '@/components/webhook-settings';
import { GitSync } from '@/components/git-sync';

interface PageProps {
  params: Promise<{ project: string }>;
}

export default async function ProjectSettingsPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { project: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { _count: { select: { pages: true } } },
  });

  if (!project || project.userId !== session.user.id) notFound();

  return (
    <div className="min-h-screen bg-theme-page">
      <Container className="py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-theme-muted">
          <Link href="/dashboard" className="hover:text-theme-main transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href={`/docs/${project.id}`} className="hover:text-theme-main transition-colors">{project.name}</Link>
          <span>/</span>
          <span className="text-theme-subtle">Settings</span>
        </div>

        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-theme-main">Project Settings</h1>
          <p className="mt-2 text-sm text-theme-subtle">
            Manage your project visibility, domain, and details.
          </p>

          <div className="mt-8 space-y-8">
            <ProjectSettingsForm project={project} />

            <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
              <h2 className="text-lg font-semibold text-theme-main flex items-center gap-2">
                <Download className="h-4 w-4 text-theme-muted" />
                Export
              </h2>
              <p className="mt-1 text-sm text-theme-subtle">
                Download all pages as Markdown files with frontmatter metadata.
              </p>
              <div className="mt-4">
                <a
                  href={`/api/projects/${project.id}/export`}
                  className="btn-secondary text-sm"
                >
                  <Download className="h-4 w-4" />
                  Export as .zip
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
              <GitSync projectId={project.id} />
            </div>

            <ApiKeyManager projectId={project.id} />

            <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
              <WebhookSettings projectId={project.id} />
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-theme-card p-6">
              <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
              <p className="mt-1 text-sm text-theme-subtle">
                Irreversible actions for this project.
              </p>
              <div className="mt-4">
                <form
                  action={async () => {
                    'use server';
                    const { auth: getAuth } = await import('@/lib/auth');
                    const session = await getAuth();
                    if (!session?.user?.id) return;

                    const project = await prisma.project.findFirst({
                      where: {
                        id: projectId,
                        team: { members: { some: { userId: session.user.id, role: 'admin' } } },
                      },
                    });
                    if (!project) return;

                    await prisma.docPage.deleteMany({ where: { projectId } });
                    await prisma.apiKey.deleteMany({ where: { projectId } });
                    await prisma.project.delete({ where: { id: projectId } });
                    redirect('/dashboard');
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    Delete Project
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
