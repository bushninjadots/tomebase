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
    <div className="min-h-screen bg-theme-page">
      <Container className="py-8">
        <Link
          href={`/docs/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-theme-muted hover:text-theme-subtle transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {project.name}
        </Link>

        <article className="mx-auto max-w-3xl">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-theme-main">{page.title}</h1>
          {page.description && (
            <p className="mb-8 text-lg text-theme-muted">{page.description}</p>
          )}
          <Markdown content={page.content} />
        </article>

        <div className="mx-auto mt-12 max-w-3xl border-t border-theme-border pt-6 text-xs text-theme-muted">
          Last updated: {new Date(page.updatedAt).toLocaleDateString()}
        </div>
      </Container>
    </div>
  );
}
