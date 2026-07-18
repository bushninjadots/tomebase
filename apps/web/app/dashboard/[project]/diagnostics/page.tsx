import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import { DiagnosticsClient } from '@/components/diagnostics/diagnostics-client';
import { scanPages } from '@/lib/diagnostics/engine';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { DiagnosticPage, HealthScore } from '@fluid/types';

interface PageProps {
  params: Promise<{ project: string }>;
}

export default async function DiagnosticsPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { project: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { _count: { select: { pages: true } } },
  });

  if (!project || project.userId !== session.user.id) notFound();

  const pages = await prisma.docPage.findMany({
    where: { projectId },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      description: true,
      published: true,
      viewCount: true,
      lastViewedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { title: 'asc' },
  });

  const diagnosticPages: DiagnosticPage[] = pages.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content,
    description: p.description,
    published: p.published,
    viewCount: p.viewCount,
    lastViewedAt: p.lastViewedAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  const scanResult = scanPages(diagnosticPages);

  return (
    <div className="min-h-screen bg-theme-page">
      <Container className="py-6">
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: project.name, href: `/docs/${project.id}` },
              { label: 'Diagnostics' },
            ]}
          />
        </div>
      </Container>

      <DiagnosticsClient
        projectId={projectId}
        pages={diagnosticPages}
        initialHealthScore={scanResult.healthScore}
        initialDiagnostics={scanResult.diagnostics}
      />
    </div>
  );
}
