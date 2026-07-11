import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import { DocSidebar } from './sidebar';
import { DocEditor } from './editor';

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

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B1020]">
      <DocSidebar project={project} />
      <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <DocEditor project={project} />
      </main>
    </div>
  );
}
