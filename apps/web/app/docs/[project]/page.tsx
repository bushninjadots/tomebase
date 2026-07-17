import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import { DocEditorWithAI } from './doc-editor-with-ai';

interface PageProps {
  params: Promise<{ project: string }>;
}

export default async function ProjectDocsPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { project: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      pages: { orderBy: { order: 'asc' } },
    },
  });

  if (!project || project.userId !== session.user.id) notFound();

  return <DocEditorWithAI project={project} />;
}
