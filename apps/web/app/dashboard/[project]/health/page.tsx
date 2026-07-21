import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity, Zap, BarChart3, ArrowRight,
} from 'lucide-react';
import { scanPages } from '@/lib/diagnostics/engine';
import { calculateHealthScore } from '@/lib/diagnostics/health-score';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { HealthScanButton } from '@/components/health-scan-button';
import { HealthScoreCard } from '@/components/health-score-card';
import { HealthAIInsights } from '@/components/health-ai-insights';
import { CriticalIssuesPanel as HealthCriticalIssues } from '@/components/health-critical-issues';
import { PagesNeedingAttention as HealthPagesNeedingAttention } from '@/components/health-pages-needing-attention';
import { HealthAnalytics } from '@/components/health-analytics';
import { HealthAIStatus } from '@/components/health-ai-status';
import { HealthEmptyState } from '@/components/health-empty';
import { HealthTrendChart } from '@/components/health-trend-chart';
import { DiagnosticsTab } from '@/components/diagnostics/diagnostics-tab';
import type { DiagnosticPage, Diagnostic } from '@fluid/types';

interface PageProps {
  params: Promise<{ project: string }>;
  searchParams: Promise<{ tab?: string }>;
}

interface PageScoreData {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  score: number;
  viewCount: number;
  wordCount: number;
  readingTimeMin: number;
  issues: Diagnostic[];
  content: string;
}

function mapPages(raw: Array<{
  id: string; title: string; slug: string; content: string; published: boolean;
  description: string | null; createdAt: Date; updatedAt: Date; viewCount: number; lastViewedAt: Date | null;
}>) {
  return raw.map((p) => ({
    id: p.id, title: p.title, slug: p.slug, content: p.content,
    description: p.description, published: p.published, viewCount: p.viewCount,
    lastViewedAt: p.lastViewedAt, createdAt: p.createdAt, updatedAt: p.updatedAt,
  }));
}

function computePageScores(pages: ReturnType<typeof mapPages>, diagnostics: Diagnostic[]): PageScoreData[] {
  return pages.map((page) => {
    const pageIssues = diagnostics.filter((d) => d.pageId === page.id);
    const wordCount = (page.content || '').split(/\s+/).filter(Boolean).length;
    const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));
    const score = calculateHealthScore(pageIssues).score;

    return { ...page, score, wordCount, readingTimeMin, issues: pageIssues };
  });
}

export default async function ProjectHealthPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { project: projectId } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === 'diagnostics' ? 'diagnostics' : 'overview';

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { _count: { select: { pages: true } } },
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

  const pages = mapPages(rawPages);
  const diagnosticPages: DiagnosticPage[] = pages;
  const scanResult = scanPages(diagnosticPages);
  const { diagnostics, healthScore } = scanResult;

  const pageScores = computePageScores(pages, diagnostics);

  const previousReport = await prisma.healthReport.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    select: { score: true, createdAt: true },
  });

  const errorDiagnostics = diagnostics.filter((d) => d.severity === 'error');
  const warningDiagnostics = diagnostics.filter((d) => d.severity === 'warning');

  const totalWordCount = pageScores.reduce((sum, p) => sum + p.wordCount, 0);
  const avgReadingTime = pageScores.length > 0
    ? Math.round(pageScores.reduce((sum, p) => sum + p.readingTimeMin, 0) / pageScores.length)
    : 0;
  const bestPages = pageScores.filter((p) => p.score === 100).length;
  const pagesWithZeroViews = pageScores.filter((p) => p.viewCount === 0).length;
  const pagesWithContent = pageScores.filter((p) => p.wordCount > 10).length;

  // Fetch repository index stats
  let repoIndexStats: { codeBlocks: number; mermaidDiagrams: number; tables: number; totalEntries: number } | null = null;
  try {
    const entryCount = await prisma.repositoryIndexEntry.count({ where: { projectId } });
    if (entryCount > 0) {
      const kindCounts = await prisma.repositoryIndexEntry.groupBy({
        by: ['kind'], where: { projectId }, _count: true,
      });
      repoIndexStats = {
        totalEntries: entryCount,
        codeBlocks: kindCounts.find((k) => k.kind === 'code_block')?._count ?? 0,
        mermaidDiagrams: kindCounts.find((k) => k.kind === 'mermaid')?._count ?? 0,
        tables: kindCounts.find((k) => k.kind === 'table')?._count ?? 0,
      };
    }
  } catch {
    // Index may not exist
  }

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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-theme-main">Documentation Health</h1>
            </div>
            <HealthScanButton projectId={projectId} />
          </div>
          <p className="text-sm text-theme-subtle mb-6">
            Scanned {pages.length} page{pages.length === 1 ? '' : 's'} for quality, freshness, and engagement.
            {previousReport && (
              <span className="ml-2 text-theme-muted">
                Last scan {formatDistanceToNow(previousReport.createdAt, { addSuffix: true })}
              </span>
            )}
          </p>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-theme-border mb-8">
            <Link
              href={`/dashboard/${projectId}/health`}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-theme-accent text-theme-accent'
                  : 'border-transparent text-theme-muted hover:text-theme-main'
              }`}
            >
              <Activity className="h-4 w-4" />
              Overview
            </Link>
            <Link
              href={`/dashboard/${projectId}/health?tab=diagnostics`}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'diagnostics'
                  ? 'border-theme-accent text-theme-accent'
                  : 'border-transparent text-theme-muted hover:text-theme-main'
              }`}
            >
              <Zap className="h-4 w-4" />
              Diagnostics & Auto-Fix
              {diagnostics.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-theme-accent/10 px-2 py-0.5 text-[10px] font-bold text-theme-accent tabular-nums">
                  {diagnostics.length}
                </span>
              )}
            </Link>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' ? (
            <div className="space-y-8">
              {/* All clear state */}
              {diagnostics.length === 0 ? (
                <HealthEmptyState projectId={projectId} pageCount={pages.length} />
              ) : (
                <>
                  {/* Section 1: Health Score Card */}
                  <HealthScoreCard
                    healthScore={healthScore}
                    previousScore={previousReport?.score ?? null}
                    previousScanTime={previousReport?.createdAt ?? null}
                    pageCount={pages.length}
                  />

                  {/* Section 1b: Score Trend Chart */}
                  <HealthTrendChart
                    projectId={projectId}
                    currentScore={healthScore.score}
                  />

                  {/* Section 2: Critical Issues */}
                  <HealthCriticalIssues
                    diagnostics={diagnostics}
                    projectId={projectId}
                  />

                  {/* Section 3: AI Analysis */}
                  <HealthAIInsights
                    projectId={projectId}
                    diagnostics={diagnostics}
                    healthScore={healthScore.score}
                    totalPages={pages.length}
                  />

                  {/* Section 4: Pages Needing Attention */}
                  <HealthPagesNeedingAttention
                    pages={pageScores.map((p) => ({
                      id: p.id,
                      title: p.title,
                      slug: p.slug,
                      score: p.score,
                      wordCount: p.wordCount,
                      viewCount: p.viewCount,
                      issues: p.issues,
                      published: p.published,
                    }))}
                    projectId={projectId}
                  />

                  {/* Section 5: Content Analytics */}
                  <HealthAnalytics
                    totalPages={pages.length}
                    perfectPages={bestPages}
                    totalWords={totalWordCount}
                    avgReadingTime={avgReadingTime}
                    repoIndexStats={repoIndexStats}
                    pagesWithZeroViews={pagesWithZeroViews}
                    totalPagesWithContent={pagesWithContent}
                  />

                  {/* Section 6: AI Status */}
                  <HealthAIStatus />

                  {/* Footer info */}
                  <div className="rounded-2xl border border-theme-border bg-theme-card px-5 py-4 flex items-center gap-3 text-xs text-theme-muted">
                    <Activity className="h-4 w-4 shrink-0 text-theme-accent" />
                    <span>
                      Health score considers link quality, content structure, freshness, engagement, and code examples.
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <DiagnosticsTab
              projectId={projectId}
              pages={diagnosticPages}
              healthScore={healthScore}
              initialDiagnostics={diagnostics}
            />
          )}
        </div>
      </Container>
    </div>
  );
}
