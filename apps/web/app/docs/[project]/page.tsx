import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import { DocEditorWithAI } from './doc-editor-with-ai';

interface PageProps {
  params: Promise<{ project: string }>;
  searchParams: Promise<{ line?: string; page?: string }>;
}

export default async function ProjectDocsPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { project: projectId } = await params;
  const { line, page } = await searchParams;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      pages: { orderBy: { order: 'asc' } },
    },
  });

  if (!project || project.userId !== session.user.id) notFound();

  return <DocEditorWithAI project={project} initialLine={line ? parseInt(line, 10) : undefined} initialPageSlug={page} />;
}
