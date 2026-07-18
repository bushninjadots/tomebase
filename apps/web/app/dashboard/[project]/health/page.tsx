import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import Link from 'next/link';
import {
  AlertTriangle, Unlink, FileText, CheckCircle,
  Clock, Eye, TrendingDown, AlertCircle, Scan, Code,
  AlignLeft, List, BookOpen, Heading, GitBranch, FileX, Activity,
  ArrowUpRight, ArrowDownRight, Minus, Zap, Link as LinkIcon,
} from 'lucide-react';
import { getHealthColor, getHealthLabel, getScoreRingColor } from '@/lib/health';
import { scanPages } from '@/lib/diagnostics/engine';
import { formatDistanceToNow } from 'date-fns';
import { HealthScanButton } from '@/components/health-scan-button';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { DiagnosticsTab } from '@/components/diagnostics/diagnostics-tab';
import { HealthAIInsights } from '@/components/health-ai-insights';
import type { DiagnosticPage, Diagnostic, DiagnosticCategory, CategoryBreakdown } from '@fluid/types';

interface PageProps {
  params: Promise<{ project: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const CATEGORY_ICONS: Partial<Record<DiagnosticCategory, React.ComponentType<{ className?: string }>>> = {
  broken_link: Unlink,
  orphan_page: GitBranch,
  empty_page: FileX,
  stale_docs: Clock,
  heading_hierarchy: Heading,
  missing_code_block_language: Code,
  large_page: FileText,
  missing_description: FileText,
  duplicate_title: AlertTriangle,
  code_language_diversity: Code,
  structure_depth: GitBranch,
  missing_code_examples: Code,
  too_many_diagrams: Code,
  missing_related_pages: LinkIcon,
  mermaid_syntax: Code,
  broken_image: Unlink,
  invalid_markdown: AlertTriangle,
  missing_toc: List,
  deprecated_syntax: AlertTriangle,
  missing_frontmatter: FileText,
  missing_title: Heading,
  missing_tags: BookOpen,
  unlinked_page: GitBranch,
  imported_code_stale: Clock,
  orphan_section: GitBranch,
};

function getCategoryIcon(category: string): React.ComponentType<{ className?: string }> {
  return CATEGORY_ICONS[category as DiagnosticCategory] || AlertCircle;
}

function getSeverityStyle(severity: string): string {
  switch (severity) {
    case 'error': return 'border-red-500/20 bg-red-500/10';
    case 'warning': return 'border-amber-500/20 bg-amber-500/10';
    default: return 'border-theme-accent/20 bg-theme-accent/10';
  }
}

function getSeverityIconStyle(severity: string): string {
  switch (severity) {
    case 'error': return 'text-red-400';
    case 'warning': return 'text-amber-400';
    default: return 'text-theme-accent';
  }
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
}

function computePageScores(pages: ReturnType<typeof mapPages>, diagnostics: Diagnostic[]): PageScoreData[] {
  return pages.map((page) => {
    const pageIssues = diagnostics.filter((d) => d.pageId === page.id);
    const wordCount = (page.content || '').split(/\s+/).filter(Boolean).length;
    const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

    let score = 100;
    for (const issue of pageIssues) {
      if (issue.severity === 'error') score -= 15;
      else if (issue.severity === 'warning') score -= 8;
      else score -= 3;
    }
    score = Math.max(0, Math.min(100, score));

    return { ...page, score, wordCount, readingTimeMin, issues: pageIssues };
  });
}

function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreRingColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-theme-border" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-theme-main">{score}</span>
        <span className="text-xs text-theme-muted mt-1">out of 100</span>
      </div>
    </div>
  );
}

function ScoreTrend({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) return null;
  const diff = current - previous;
  if (diff === 0) return (
    <span className="flex items-center gap-1 text-xs text-theme-muted">
      <Minus className="h-3 w-3" /> No change
    </span>
  );
  const positive = diff > 0;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {positive ? '+' : ''}{diff} from last scan
    </span>
  );
}

function CategoryCard({ item }: { item: CategoryBreakdown }) {
  const Icon = getCategoryIcon(item.category);
  return (
    <div className={`rounded-xl border p-4 ${getSeverityStyle(item.severity)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${getSeverityIconStyle(item.severity)}`} />
          <span className="text-sm font-medium text-theme-main">{item.label}</span>
        </div>
        <span className="text-lg font-bold text-theme-main">{item.count}</span>
      </div>
    </div>
  );
}

function PageLink({ projectId, slug, children, className }: { projectId: string; slug: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={`/docs/${projectId}/${slug}`} className={className}>
      {children}
    </Link>
  );
}

function mapPages(raw: Array<{
  id: string; title: string; slug: string; content: string; published: boolean;
  description: string | null; createdAt: Date; updatedAt: Date; viewCount: number; lastViewedAt: Date | null;
}>) {
  return raw.map((p) => ({
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
  const infoDiagnostics = diagnostics.filter((d) => d.severity === 'info');

  const pagesByScore = [...pageScores].sort((a, b) => a.score - b.score);
  const worstPages = pagesByScore.slice(0, 10);
  const bestPages = pageScores.filter((p) => p.score === 100).length;
  const totalWordCount = pageScores.reduce((sum, p) => sum + p.wordCount, 0);
  const avgReadingTime = pageScores.length > 0
    ? Math.round(pageScores.reduce((sum, p) => sum + p.readingTimeMin, 0) / pageScores.length)
    : 0;

  const summary = healthScore.categoryBreakdown;

  // Check if AI provider is configured for the insights section
  const aiConfig = await prisma.aIProviderConfig.findFirst({
    where: { userId: session.user.id, enabled: true },
    orderBy: { updatedAt: 'desc' },
  });

  // Fetch repository index stats for the overview
  let repoIndexStats: { codeBlocks: number; mermaidDiagrams: number; tables: number; totalEntries: number } | null = null;
  try {
    const entryCount = await prisma.repositoryIndexEntry.count({ where: { projectId } });
    if (entryCount > 0) {
      const kindCounts = await prisma.repositoryIndexEntry.groupBy({
        by: ['kind'],
        where: { projectId },
        _count: true,
      });
      repoIndexStats = {
        totalEntries: entryCount,
        codeBlocks: kindCounts.find((k) => k.kind === 'code_block')?._count ?? 0,
        mermaidDiagrams: kindCounts.find((k) => k.kind === 'mermaid')?._count ?? 0,
        tables: kindCounts.find((k) => k.kind === 'table')?._count ?? 0,
      };
    }
  } catch {
    // Index may not exist — skip
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

        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-theme-main">Documentation Health</h1>
              <span className={`flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-medium ${getHealthColor(healthScore.score)}`}>
                {healthScore.score >= 80 ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                {healthScore.label}
              </span>
            </div>
            <HealthScanButton projectId={projectId} />
          </div>
          <p className="text-sm text-theme-subtle">
            Scanned {pages.length} page{pages.length === 1 ? '' : 's'} for quality, freshness, and engagement.
          </p>

          {/* Tab Navigation */}
          <div className="mt-6 flex items-center gap-1 border-b border-theme-border">
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
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-theme-accent/10 px-2 py-0.5 text-[10px] font-semibold text-theme-accent">
                  {diagnostics.length}
                </span>
              )}
            </Link>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' ? (
            <>
              {/* Hero Score */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 rounded-xl border border-theme-border bg-theme-card p-6 flex flex-col items-center justify-center">
                  <ScoreRing score={healthScore.score} />
                  <div className="mt-4 text-center">
                    <div className="text-sm font-medium text-theme-main">{healthScore.label}</div>
                    <ScoreTrend current={healthScore.score} previous={previousReport?.score ?? null} />
                  </div>
                </div>

                <div className="md:col-span-2 rounded-xl border border-theme-border bg-theme-card p-6">
                  <h3 className="text-sm font-semibold text-theme-main mb-4">Issue Summary</h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{healthScore.errorCount}</div>
                      <div className="text-xs text-theme-muted">Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-400">{healthScore.warningCount}</div>
                      <div className="text-xs text-theme-muted">Warnings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-theme-accent">{healthScore.infoCount}</div>
                      <div className="text-xs text-theme-muted">Info</div>
                    </div>
                  </div>

                  {summary.length > 0 ? (
                    <div className="space-y-2">
                      {summary.map((item) => (
                        <CategoryCard key={item.category} item={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-theme-muted">No issues found — documentation is healthy!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-theme-border bg-theme-card p-4">
                  <div className="flex items-center gap-2 text-xs text-theme-muted"><FileText className="h-3.5 w-3.5" />Total Pages</div>
                  <div className="mt-1 text-xl font-bold text-theme-main">{pages.length}</div>
                </div>
                <div className="rounded-xl border border-theme-border bg-theme-card p-4">
                  <div className="flex items-center gap-2 text-xs text-theme-muted"><CheckCircle className="h-3.5 w-3.5" />Perfect Pages</div>
                  <div className="mt-1 text-xl font-bold text-green-400">{bestPages}</div>
                </div>
                <div className="rounded-xl border border-theme-border bg-theme-card p-4">
                  <div className="flex items-center gap-2 text-xs text-theme-muted"><BookOpen className="h-3.5 w-3.5" />Total Words</div>
                  <div className="mt-1 text-xl font-bold text-theme-main">{totalWordCount.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-theme-border bg-theme-card p-4">
                  <div className="flex items-center gap-2 text-xs text-theme-muted"><Clock className="h-3.5 w-3.5" />Avg. Reading Time</div>
                  <div className="mt-1 text-xl font-bold text-theme-main">{avgReadingTime} min</div>
                </div>
              </div>

              {/* Repository Index Stats */}
              {repoIndexStats && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-theme-border bg-theme-card p-4">
                    <div className="flex items-center gap-2 text-xs text-theme-muted"><Code className="h-3.5 w-3.5" />Code Blocks</div>
                    <div className="mt-1 text-xl font-bold text-theme-main">{repoIndexStats.codeBlocks}</div>
                  </div>
                  <div className="rounded-xl border border-theme-border bg-theme-card p-4">
                    <div className="flex items-center gap-2 text-xs text-theme-muted"><Activity className="h-3.5 w-3.5" />Diagrams</div>
                    <div className="mt-1 text-xl font-bold text-theme-main">{repoIndexStats.mermaidDiagrams}</div>
                  </div>
                  <div className="rounded-xl border border-theme-border bg-theme-card p-4">
                    <div className="flex items-center gap-2 text-xs text-theme-muted"><FileText className="h-3.5 w-3.5" />Tables</div>
                    <div className="mt-1 text-xl font-bold text-theme-main">{repoIndexStats.tables}</div>
                  </div>
                  <div className="rounded-xl border border-theme-border bg-theme-card p-4">
                    <div className="flex items-center gap-2 text-xs text-theme-muted"><Zap className="h-3.5 w-3.5" />Index Entries</div>
                    <div className="mt-1 text-xl font-bold text-theme-main">{repoIndexStats.totalEntries}</div>
                  </div>
                </div>
              )}

              {/* AI Insights */}
              <HealthAIInsights
                projectId={projectId}
                diagnostics={diagnostics}
                healthScore={healthScore.score}
                aiConfigured={!!aiConfig}
                totalPages={pages.length}
              />

              {/* Broken Links */}
              {errorDiagnostics.filter((d) => d.category === 'broken_link').length > 0 && (
                <section className="mt-8">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-theme-main">
                    <Unlink className="h-4 w-4 text-red-400" />
                    Broken Wiki Links
                    <span className="ml-auto text-sm font-normal text-theme-muted">{errorDiagnostics.filter((d) => d.category === 'broken_link').length}</span>
                  </h2>
                  <p className="mt-1 text-sm text-theme-subtle mb-3">These links reference pages that don&apos;t exist yet.</p>
                  <div className="space-y-2">
                    {errorDiagnostics.filter((d) => d.category === 'broken_link').slice(0, 15).map((d) => (
                      <div key={d.id} className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm">
                        <span className="font-medium text-theme-main">{d.title}</span>
                        <span className="text-theme-muted mx-1.5">in</span>
                        <PageLink projectId={project.id} slug={d.pageSlug} className="text-theme-accent hover:underline underline-offset-2">
                          {d.pageTitle}
                        </PageLink>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Worst Pages */}
              {worstPages.length > 0 && worstPages[0]!.score < 100 && (
                <section className="mt-8">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-theme-main">
                    <TrendingDown className="h-4 w-4 text-amber-400" />
                    Pages Needing Attention
                    <span className="ml-auto text-sm font-normal text-theme-muted">{worstPages.length}</span>
                  </h2>
                  <p className="mt-1 text-sm text-theme-subtle mb-3">Pages with the lowest health scores — prioritize these first.</p>
                  <div className="rounded-xl border border-theme-border bg-theme-card overflow-hidden">
                    <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px_60px] gap-4 px-4 py-2 text-xs font-medium text-theme-muted border-b border-theme-border bg-theme-page/50">
                      <span>Page</span><span className="text-center">Score</span><span className="text-center">Words</span><span className="text-center">Views</span><span className="text-center">Issues</span>
                    </div>
                    {worstPages.map((page) => (
                      <div key={page.id}>
                        <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px_60px] gap-4 px-4 py-3 text-sm border-b border-theme-border last:border-0 hover:bg-theme-hover transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <PageLink projectId={project.id} slug={page.slug} className="font-medium text-theme-main truncate hover:text-theme-accent">
                              {page.title}
                            </PageLink>
                            {!page.published && <span className="shrink-0 rounded bg-theme-hover px-1.5 py-0.5 text-[10px] text-theme-muted">draft</span>}
                          </div>
                          <div className="flex items-center justify-center">
                            <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-bold ${
                              page.score >= 80 ? 'bg-green-500/10 text-green-400' :
                              page.score >= 60 ? 'bg-amber-500/10 text-amber-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>{page.score}</span>
                          </div>
                          <div className="flex items-center justify-center text-theme-muted text-xs">{page.wordCount.toLocaleString()}</div>
                          <div className="flex items-center justify-center text-theme-muted text-xs">{page.viewCount}</div>
                          <div className="flex items-center justify-center text-theme-muted text-xs">{page.issues.length}</div>
                        </div>
                        <div className="sm:hidden px-4 py-3 border-b border-theme-border last:border-0 hover:bg-theme-hover transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <PageLink projectId={project.id} slug={page.slug} className="font-medium text-theme-main truncate hover:text-theme-accent">
                                {page.title}
                              </PageLink>
                              {!page.published && <span className="shrink-0 rounded bg-theme-hover px-1.5 py-0.5 text-[10px] text-theme-muted">draft</span>}
                            </div>
                            <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-bold shrink-0 ml-2 ${
                              page.score >= 80 ? 'bg-green-500/10 text-green-400' :
                              page.score >= 60 ? 'bg-amber-500/10 text-amber-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>{page.score}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-theme-muted">
                            <span>{page.wordCount.toLocaleString()} words</span>
                            <span>{page.viewCount} views</span>
                            <span>{page.issues.length} issues</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Empty & Orphan pages */}
              {(warningDiagnostics.filter((d) => d.category === 'empty_page').length > 0 || warningDiagnostics.filter((d) => d.category === 'orphan_page').length > 0) && (
                <section className="mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {warningDiagnostics.filter((d) => d.category === 'empty_page').length > 0 && (
                      <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-theme-main mb-3">
                          <FileX className="h-4 w-4 text-amber-400" />Empty Pages
                          <span className="ml-auto text-sm font-normal text-theme-muted">{warningDiagnostics.filter((d) => d.category === 'empty_page').length}</span>
                        </h2>
                        <div className="space-y-2">
                          {warningDiagnostics.filter((d) => d.category === 'empty_page').slice(0, 8).map((d) => (
                            <div key={d.id} className="flex items-center justify-between rounded-xl border border-theme-border bg-theme-card px-4 py-3 text-sm">
                              <span className="font-medium text-theme-main">{d.pageTitle}</span>
                              <PageLink projectId={project.id} slug={d.pageSlug} className="text-theme-accent text-xs font-medium hover:underline">Edit</PageLink>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {warningDiagnostics.filter((d) => d.category === 'orphan_page').length > 0 && (
                      <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-theme-main mb-3">
                          <GitBranch className="h-4 w-4 text-theme-accent" />Orphan Pages
                          <span className="ml-auto text-sm font-normal text-theme-muted">{warningDiagnostics.filter((d) => d.category === 'orphan_page').length}</span>
                        </h2>
                        <div className="space-y-2">
                          {warningDiagnostics.filter((d) => d.category === 'orphan_page').slice(0, 8).map((d) => (
                            <div key={d.id} className="flex items-center justify-between rounded-xl border border-theme-border bg-theme-card px-4 py-3 text-sm">
                              <span className="font-medium text-theme-main">{d.pageTitle}</span>
                              <PageLink projectId={project.id} slug={d.pageSlug} className="text-theme-accent text-xs font-medium hover:underline">Link</PageLink>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* All clear */}
              {diagnostics.length === 0 && (
                <div className="mt-12 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-theme-main">Documentation is healthy!</h2>
                  <p className="mt-2 text-sm text-theme-subtle max-w-md mx-auto">
                    All {pages.length} page{pages.length === 1 ? '' : 's'} have content, all links resolve, and engagement is good. Keep it up!
                  </p>
                </div>
              )}

              <div className="mt-8 rounded-xl border border-theme-border bg-theme-card px-4 py-3 flex items-center gap-2 text-xs text-theme-muted">
                <Activity className="h-3.5 w-3.5 shrink-0" />
                Health score considers link quality, content structure, freshness, engagement, and code examples.
                {previousReport && <span className="ml-auto">Last scan: {formatDistanceToNow(previousReport.createdAt, { addSuffix: true })}</span>}
              </div>
            </>
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
