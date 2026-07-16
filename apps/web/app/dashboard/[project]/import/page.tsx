import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import Link from 'next/link';
import { ImportWizard } from '@/components/import/import-wizard';

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
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-theme-muted">
          <Link href="/dashboard" className="hover:text-theme-main transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href={`/docs/${project.id}`} className="hover:text-theme-main transition-colors">{project.name}</Link>
          <span>/</span>
          <span className="text-theme-subtle">Import</span>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-theme-main tracking-tight">Import Documentation</h1>
          <p className="mt-1.5 text-sm text-theme-muted">
            Auto-generate documentation from source code or OpenAPI specifications.
          </p>
        </div>

        {/* Import Wizard */}
        <ImportWizard projectId={project.id} projectName={project.name} />
      </div>
    </div>
  );
}
