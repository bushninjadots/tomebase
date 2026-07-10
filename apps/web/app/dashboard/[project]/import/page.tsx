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
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href={`/docs/${project.id}`} className="hover:text-gray-700 transition-colors">{project.name}</Link>
          <span>/</span>
          <span className="text-gray-600">Import</span>
        </div>

        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold text-theme-main">Import</h1>
          <p className="mt-1 text-sm text-gray-500">
            Auto-generate documentation from source code or OpenAPI specs.
          </p>

          <div className="mt-8">
            <ImportTabs projectId={project.id} />
          </div>
        </div>
      </Container>
    </div>
  );
}
