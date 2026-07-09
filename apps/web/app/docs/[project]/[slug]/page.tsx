import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Markdown } from '@/components/markdown';

interface PageProps {
  params: Promise<{ project: string; slug: string }>;
}

export default async function DocPageView({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { project: projectId, slug } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project || project.userId !== session.user.id) notFound();

  const page = await prisma.docPage.findFirst({
    where: { projectId, slug },
  });

  if (!page || page.projectId !== projectId) notFound();

  return (
    <div className="min-h-screen bg-white">
      <Container className="py-8">
        <Link
          href={`/docs/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {project.name}
        </Link>

        <article className="mx-auto max-w-3xl">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">{page.title}</h1>
          {page.description && (
            <p className="mb-8 text-lg text-gray-500">{page.description}</p>
          )}
          <Markdown content={page.content} />
        </article>

        <div className="mx-auto mt-12 max-w-3xl border-t border-gray-100 pt-6 text-xs text-gray-400">
          Last updated: {new Date(page.updatedAt).toLocaleDateString()}
        </div>
      </Container>
    </div>
  );
}
