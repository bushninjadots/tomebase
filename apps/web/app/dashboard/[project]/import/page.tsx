import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ImportTabs } from './tabs';

interface PageProps {
  params: Promise<{ project: string }>;
}

export default async function ImportPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { project: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
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
          <span className="text-theme-subtle">Import</span>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-theme-main">Import</h1>
              <p className="mt-1 text-sm text-theme-muted">
                Auto-generate documentation from source code or OpenAPI specs.
              </p>
            </div>
          </div>

          <ImportTabs projectId={project.id} />
        </div>
      </Container>
    </div>
  );
}
