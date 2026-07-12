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
import { ExportProjectSection } from './export-section';
import { ProjectDangerZone } from './danger-zone';

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

            <ExportProjectSection projectId={project.id} projectName={project.name} pageCount={project._count.pages} />

            <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
              <GitSync projectId={project.id} />
            </div>

            <ApiKeyManager projectId={project.id} />

            <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
              <WebhookSettings projectId={project.id} />
            </div>

            <ProjectDangerZone projectId={project.id} projectName={project.name} />
          </div>
        </div>
      </Container>
    </div>
  );
}
