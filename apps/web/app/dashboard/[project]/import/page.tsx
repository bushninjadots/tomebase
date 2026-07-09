import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import Link from 'next/link';
import { ImportForm } from './form';
import { ArrowLeft } from 'lucide-react';

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
        <Link
          href={`/docs/${project.id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {project.name}
        </Link>

        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-900">Import from Code</h1>
          <p className="mt-1 text-sm text-gray-500">
            Paste your source code below. Fluid will parse JSDoc comments, types, and signatures to auto-generate documentation pages.
          </p>

          <div className="mt-8">
            <ImportForm projectId={project.id} />
          </div>
        </div>
      </Container>
    </div>
  );
}
