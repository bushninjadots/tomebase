import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import Link from 'next/link';
import {
  ArrowLeft, AlertTriangle, Unlink, FileText, Search, CheckCircle,
  Clock, Eye, TrendingDown, AlertCircle, Calendar, Scan, Code,
  AlignLeft, List, BookOpen, Heading, GitBranch, FileX, Activity,
  ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import { analyzePages, getHealthColor, getHealthLabel, getScoreRingColor, type HealthReport as HealthReportType, type CategorySummary } from '@/lib/health';
import { formatDistanceToNow } from 'date-fns';

interface PageProps {
  params: Promise<{ project: string }>;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Unlink, GitBranch, FileX, Clock, Eye, Heading, Code, AlignLeft, List, FileText, BookOpen,
};

function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreRingColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-theme-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
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
    <span className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {positive ? '+' : ''}{diff} from last scan
    </span>
  );
}

function CategoryCard({ item }: { item: CategorySummary }) {
  const Icon = ICON_MAP[item.icon] || AlertCircle;
  const severityColors = {
    error: 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20',
    warning: 'border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20',
    info: 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20',
  };
  const iconColors = {
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  };
  return (
    <div className={`rounded-xl border p-4 ${severityColors[item.severity]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColors[item.severity]}`} />
          <span className="text-sm font-medium text-theme-main">{item.label}</span>
        </div>
        <span className="text-lg font-bold text-theme-main">{item.count}</span>
      </div>
    </div>
  );
}

export default async function ProjectHealthPage({ params }: PageProps) {
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
      published: true,
      createdAt: true,
      updatedAt: true,
      viewCount: true,
      lastViewedAt: true,
    },
    orderBy: { title: 'asc' },
  });

  const report = analyzePages(pages);

  const previousReport = await prisma.healthReport.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    select: { score: true, createdAt: true },
  });

  const errorIssues = report.issues.filter((i) => i.severity === 'error');
  const warningIssues = report.issues.filter((i) => i.severity === 'warning');
  const infoIssues = report.issues.filter((i) => i.severity === 'info');

  const pagesByScore = [...report.pageScores].sort((a, b) => a.score - b.score);
  const worstPages = pagesByScore.slice(0, 10);
  const bestPages = pagesByScore.filter((p) => p.score === 100).length;
  const publishedPages = report.pageScores.filter((p) => p.published).length;
  const totalWordCount = report.pageScores.reduce((sum, p) => sum + p.wordCount, 0);
  const avgReadingTime = report.pageScores.length > 0
    ? Math.round(report.pageScores.reduce((sum, p) => sum + p.readingTimeMin, 0) / report.pageScores.length)
    : 0;

  return (
    <div className="min-h-screen bg-theme-page">
      <Container className="py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-theme-muted">
          <Link href="/dashboard" className="hover:text-theme-main transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href={`/docs/${project.id}`} className="hover:text-theme-main transition-colors">{project.name}</Link>
          <span>/</span>
          <span className="text-theme-subtle">Health</span>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-theme-main">Documentation Health</h1>
              <span className={`flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-medium ${getHealthColor(report.score)}`}>
                {report.score >= 80 ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                {getHealthLabel(report.score)}
              </span>
            </div>
            <form action={`/api/projects/${projectId}/health`} method="POST">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-theme-border bg-theme-card px-4 py-2 text-sm font-medium text-theme-main hover:bg-theme-hover transition-colors"
              >
                <Scan className="h-4 w-4" />
                Run Health Scan
              </button>
            </form>
          </div>
          <p className="text-sm text-theme-muted">
            Scanned {report.totalPages} page{report.totalPages === 1 ? '' : 's'} for quality, freshness, and engagement.
          </p>

          {/* Hero Score */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 rounded-2xl border border-theme-border bg-theme-card p-6 flex flex-col items-center justify-center">
              <ScoreRing score={report.score} />
              <div className="mt-4 text-center">
                <div className="text-sm font-medium text-theme-main">{getHealthLabel(report.score)}</div>
                <ScoreTrend current={report.score} previous={previousReport?.score ?? null} />
              </div>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-theme-border bg-theme-card p-6">
              <h3 className="text-sm font-semibold text-theme-main mb-4">Issue Summary</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{errorIssues.length}</div>
                  <div className="text-xs text-theme-muted">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{warningIssues.length}</div>
                  <div className="text-xs text-theme-muted">Warnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{infoIssues.length}</div>
                  <div className="text-xs text-theme-muted">Info</div>
                </div>
              </div>

              {report.summary.length > 0 ? (
                <div className="space-y-2">
                  {report.summary.map((item) => (
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
              <div className="flex items-center gap-2 text-xs text-theme-muted">
                <FileText className="h-3.5 w-3.5" />
                Total Pages
              </div>
              <div className="mt-1 text-xl font-bold text-theme-main">{report.totalPages}</div>
            </div>
            <div className="rounded-xl border border-theme-border bg-theme-card p-4">
              <div className="flex items-center gap-2 text-xs text-theme-muted">
                <CheckCircle className="h-3.5 w-3.5" />
                Perfect Pages
              </div>
              <div className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">{bestPages}</div>
            </div>
            <div className="rounded-xl border border-theme-border bg-theme-card p-4">
              <div className="flex items-center gap-2 text-xs text-theme-muted">
                <BookOpen className="h-3.5 w-3.5" />
                Total Words
              </div>
              <div className="mt-1 text-xl font-bold text-theme-main">{totalWordCount.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-theme-border bg-theme-card p-4">
              <div className="flex items-center gap-2 text-xs text-theme-muted">
                <Clock className="h-3.5 w-3.5" />
                Avg. Reading Time
              </div>
              <div className="mt-1 text-xl font-bold text-theme-main">{avgReadingTime} min</div>
            </div>
          </div>

          {/* Broken Links */}
          {errorIssues.filter((i) => i.category === 'broken_link').length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-theme-main">
                <Unlink className="h-4 w-4 text-red-500" />
                Broken Wiki Links
                <span className="ml-auto text-sm font-normal text-theme-muted">
                  {errorIssues.filter((i) => i.category === 'broken_link').length}
                </span>
              </h2>
              <p className="mt-1 text-sm text-theme-muted mb-3">
                These links reference pages that don&apos;t exist yet.
              </p>
              <div className="space-y-2">
                {errorIssues.filter((i) => i.category === 'broken_link').slice(0, 15).map((issue) => (
                  <div key={issue.id} className="rounded-lg border border-red-100 bg-red-50/50 px-4 py-3 text-sm dark:border-red-900/50 dark:bg-red-950/20">
                    <span className="font-medium text-theme-main">{issue.message}</span>
                    <span className="text-theme-muted mx-1.5">in</span>
                    <Link href={`/docs/${project.id}/${issue.pageId}`} className="text-fluid-600 hover:text-fluid-700 underline underline-offset-2">
                      {issue.pageTitle}
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Worst Pages */}
          {worstPages.length > 0 && worstPages[0]!.score < 100 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-theme-main">
                <TrendingDown className="h-4 w-4 text-amber-500" />
                Pages Needing Attention
                <span className="ml-auto text-sm font-normal text-theme-muted">{worstPages.length}</span>
              </h2>
              <p className="mt-1 text-sm text-theme-muted mb-3">
                Pages with the lowest health scores — prioritize these first.
              </p>
              <div className="rounded-xl border border-theme-border bg-theme-card overflow-hidden">
                <div className="grid grid-cols-[1fr_80px_80px_80px_60px] gap-4 px-4 py-2 text-xs font-medium text-theme-muted border-b border-theme-border bg-theme-card/50">
                  <span>Page</span>
                  <span className="text-center">Score</span>
                  <span className="text-center">Words</span>
                  <span className="text-center">Views</span>
                  <span className="text-center">Issues</span>
                </div>
                {worstPages.map((page) => (
                  <div key={page.id} className="grid grid-cols-[1fr_80px_80px_80px_60px] gap-4 px-4 py-3 text-sm border-b border-theme-border last:border-0 hover:bg-theme-hover transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-theme-main truncate">{page.title}</span>
                      {!page.published && (
                        <span className="shrink-0 rounded bg-theme-hover px-1.5 py-0.5 text-[10px] text-theme-muted">draft</span>
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                      <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-bold ${
                        page.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        page.score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {page.score}
                      </span>
                    </div>
                    <div className="flex items-center justify-center text-theme-muted text-xs">{page.wordCount.toLocaleString()}</div>
                    <div className="flex items-center justify-center text-theme-muted text-xs">{page.viewCount}</div>
                    <div className="flex items-center justify-center text-theme-muted text-xs">{page.issues.length}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty & Orphan pages */}
          {(warningIssues.filter((i) => i.category === 'empty').length > 0 || warningIssues.filter((i) => i.category === 'orphan').length > 0) && (
            <section className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {warningIssues.filter((i) => i.category === 'empty').length > 0 && (
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-theme-main mb-3">
                      <FileX className="h-4 w-4 text-amber-500" />
                      Empty Pages
                      <span className="ml-auto text-sm font-normal text-theme-muted">
                        {warningIssues.filter((i) => i.category === 'empty').length}
                      </span>
                    </h2>
                    <div className="space-y-2">
                      {warningIssues.filter((i) => i.category === 'empty').slice(0, 8).map((issue) => (
                        <div key={issue.id} className="flex items-center justify-between rounded-lg border border-theme-border bg-theme-card px-4 py-3 text-sm">
                          <span className="font-medium text-theme-main">{issue.pageTitle}</span>
                          <Link href={`/docs/${project.id}/${issue.pageId}`} className="text-fluid-600 hover:text-fluid-700 text-xs font-medium">
                            Edit
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {warningIssues.filter((i) => i.category === 'orphan').length > 0 && (
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-theme-main mb-3">
                      <GitBranch className="h-4 w-4 text-blue-500" />
                      Orphan Pages
                      <span className="ml-auto text-sm font-normal text-theme-muted">
                        {warningIssues.filter((i) => i.category === 'orphan').length}
                      </span>
                    </h2>
                    <div className="space-y-2">
                      {warningIssues.filter((i) => i.category === 'orphan').slice(0, 8).map((issue) => (
                        <div key={issue.id} className="flex items-center justify-between rounded-lg border border-theme-border bg-theme-card px-4 py-3 text-sm">
                          <span className="font-medium text-theme-main">{issue.pageTitle}</span>
                          <Link href={`/docs/${project.id}/${issue.pageId}`} className="text-fluid-600 hover:text-fluid-700 text-xs font-medium">
                            Link
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* All clear */}
          {report.issues.length === 0 && (
            <div className="mt-12 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-theme-main">Documentation is healthy!</h2>
              <p className="mt-2 text-sm text-theme-muted max-w-md mx-auto">
                All {report.totalPages} page{report.totalPages === 1 ? '' : 's'} have content, all links resolve,
                and engagement is good. Keep it up!
              </p>
            </div>
          )}

          {/* Footer info */}
          <div className="mt-8 rounded-xl border border-theme-border bg-theme-card px-4 py-3 flex items-center gap-2 text-xs text-theme-muted">
            <Activity className="h-3.5 w-3.5 shrink-0" />
            Health score considers link quality, content structure, freshness, engagement, and code examples.
            {previousReport && (
              <span className="ml-auto">
                Last scan: {formatDistanceToNow(previousReport.createdAt, { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
