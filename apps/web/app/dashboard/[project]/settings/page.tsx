import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import Link from 'next/link';
import { ArrowLeft, Download, Webhook } from 'lucide-react';
import { ProjectSettingsForm } from './form';
import { ApiKeyManager } from './api-keys';
import { WebhookSettings } from '@/components/webhook-settings';

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
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        <Link
          href={`/docs/${project.id}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {project.name}
        </Link>

        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900">Project Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your project visibility, domain, and details.
          </p>

          <div className="mt-8 space-y-8">
            <ProjectSettingsForm project={project} />

            <div className="rounded-xl border border-gray-100 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Download className="h-4 w-4 text-gray-400" />
                Export
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Download all pages as Markdown files with frontmatter metadata.
              </p>
              <div className="mt-4">
                <a
                  href={`/api/projects/${project.id}/export`}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export as .zip
                </a>
              </div>
            </div>

            <ApiKeyManager projectId={project.id} />

            <div className="rounded-xl border border-gray-100 bg-white p-6">
              <WebhookSettings projectId={project.id} />
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
              <p className="mt-1 text-sm text-gray-500">
                Irreversible actions for this project.
              </p>
              <div className="mt-4">
                <form
                  action={async () => {
                    'use server';
                    const { auth: getAuth } = await import('@/lib/auth');
                    const session = await getAuth();
                    if (!session?.user?.id) return;
                    await prisma.docPage.deleteMany({ where: { projectId } });
                    await prisma.project.delete({ where: { id: projectId } });
                    redirect('/dashboard');
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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
