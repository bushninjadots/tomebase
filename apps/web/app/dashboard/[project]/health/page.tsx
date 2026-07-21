import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import { scanPages } from '@/lib/diagnostics/engine';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { HealthDashboard } from '@/components/health/health-dashboard';
import type { DiagnosticPage, HealthTimelineEntry } from '@fluid/types';

interface PageProps {
  params: Promise<{ project: string }>;
}

export default async function ProjectHealthPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { project: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, userId: true },
  });

  if (!project || project.userId !== session.user.id) notFound();

  const rawPages = await prisma.docPage.findMany({
    where: { projectId },
    select: {
      id: true, title: true, slug: true, content: true, published: true,
      description: true, createdAt: true, updatedAt: true, viewCount: true, lastViewedAt: true,
    },
    orderBy: { title: 'asc' },
  });

  const pages: DiagnosticPage[] = rawPages.map((p) => ({
    id: p.id, title: p.title, slug: p.slug, content: p.content,
    description: p.description, published: p.published, viewCount: p.viewCount,
    lastViewedAt: p.lastViewedAt, createdAt: p.createdAt, updatedAt: p.updatedAt,
  }));

  const scanResult = scanPages(pages);
  const { diagnostics, healthScore } = scanResult;

  const previousReport = await prisma.healthReport.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    select: { score: true, createdAt: true },
  });

  // Build timeline from health reports
  const reports = await prisma.healthReport.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    take: 30,
    select: { score: true, totalPages: true, createdAt: true, id: true },
  });

  const timelineEntries: HealthTimelineEntry[] = reports.map((r) => ({
    id: r.id,
    projectId,
    score: r.score,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    totalPages: r.totalPages,
    scannedAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-theme-page">
      <Container className="py-8">
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: project.name, href: `/docs/${project.id}` },
              { label: 'Health' },
            ]}
          />
        </div>

        <div className="mx-auto max-w-6xl">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-theme-main">Documentation Health</h1>
            <p className="text-sm text-theme-subtle mt-1">
              AI-powered analysis of your documentation quality, structure, and engagement.
            </p>
          </div>

          {/* Health Dashboard */}
          <HealthDashboard
            projectId={projectId}
            pages={pages}
            initialDiagnostics={diagnostics}
            healthScore={healthScore}
            previousScore={previousReport?.score ?? null}
            previousScanTime={previousReport?.createdAt ?? null}
            timelineEntries={timelineEntries}
          />
        </div>
      </Container>
    </div>
  );
}
