import type { DiagnosticPage } from '@fluid/types';
import { scanPages } from './diagnostics/engine';
import type { DiagnosticSeverity } from '@fluid/types';

export type IssueSeverity = DiagnosticSeverity;
export type IssueCategory =
  | 'broken_link' | 'orphan' | 'empty' | 'stale' | 'low_engagement'
  | 'no_headings' | 'no_code_blocks' | 'missing_language_tag'
  | 'long_paragraph' | 'no_lists' | 'thin_content' | 'reading_time'
  | 'duplicate_title' | 'missing_description' | 'missing_params'
  | 'missing_returns' | 'naming_inconsistency';

export interface HealthIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  pageTitle: string;
  pageId: string;
  pageSlug: string;
  message: string;
}

export interface CategorySummary {
  category: IssueCategory;
  label: string;
  count: number;
  severity: IssueSeverity;
  icon: string;
}

export interface HealthReport {
  score: number;
  totalPages: number;
  totalPagesScanned: number;
  issues: HealthIssue[];
  summary: CategorySummary[];
  pageScores: PageScore[];
  scannedAt: string;
}

export interface PageScore {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  score: number;
  viewCount: number;
  wordCount: number;
  readingTimeMin: number;
  issues: HealthIssue[];
}

const CATEGORY_META: Record<string, { label: string; severity: IssueSeverity; icon: string }> = {
  broken_link:          { label: 'Broken Wiki Links',   severity: 'error',   icon: 'Unlink' },
  orphan:               { label: 'Orphan Pages',        severity: 'warning', icon: 'GitBranch' },
  empty:                { label: 'Empty Pages',         severity: 'error',   icon: 'FileX' },
  stale:                { label: 'Stale Pages',         severity: 'warning', icon: 'Clock' },
  low_engagement:       { label: 'Low Engagement',      severity: 'info',    icon: 'Eye' },
  no_headings:          { label: 'No Headings',         severity: 'warning', icon: 'Heading' },
  no_code_blocks:       { label: 'No Code Examples',    severity: 'info',    icon: 'Code' },
  missing_language_tag: { label: 'Untagged Code Blocks', severity: 'warning', icon: 'Code' },
  long_paragraph:       { label: 'Long Paragraphs',     severity: 'info',    icon: 'AlignLeft' },
  no_lists:             { label: 'No Lists',            severity: 'info',    icon: 'List' },
  thin_content:         { label: 'Thin Content',        severity: 'warning', icon: 'FileText' },
  reading_time:         { label: 'Reading Time',        severity: 'info',    icon: 'BookOpen' },
  duplicate_title:      { label: 'Duplicate Titles',    severity: 'warning', icon: 'Copy' },
  missing_description:  { label: 'Missing Description', severity: 'warning', icon: 'FileText' },
  missing_params:       { label: 'Missing Parameters',  severity: 'info',    icon: 'ListOrdered' },
  missing_returns:      { label: 'Missing Returns',     severity: 'info',    icon: 'ArrowRightLeft' },
  naming_inconsistency: { label: 'Naming Inconsistency', severity: 'info',  icon: 'ALargeSmall' },
};

export function analyzePages(pages: {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  viewCount: number;
  lastViewedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
}[]): HealthReport {
  // Delegate to the diagnostics engine which is the canonical implementation
  const diagnosticPages: DiagnosticPage[] = pages.map((p) => ({
    id: p.id, title: p.title, slug: p.slug, content: p.content,
    description: null, published: p.published, viewCount: p.viewCount,
    lastViewedAt: p.lastViewedAt, createdAt: p.createdAt, updatedAt: p.updatedAt,
  }));

  const scanResult = scanPages(diagnosticPages);

  // Map diagnostic results to the legacy HealthReport format
  const issues: HealthIssue[] = scanResult.diagnostics.map((d) => ({
    id: d.id,
    category: d.category as IssueCategory,
    severity: d.severity as IssueSeverity,
    pageTitle: d.pageTitle,
    pageId: d.pageId,
    pageSlug: d.pageSlug,
    message: `${d.title}: ${d.description}`,
  }));

  const pageScores: PageScore[] = pages.map((page) => {
    const pageIssues = issues.filter((i) => i.pageId === page.id);
    const wordCount = (page.content || '').split(/\s+/).filter(Boolean).length;
    const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

    let score = 100;
    for (const issue of pageIssues) {
      if (issue.severity === 'error') score -= 15;
      else if (issue.severity === 'warning') score -= 8;
      else score -= 3;
    }
    score = Math.max(0, Math.min(100, score));

    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      published: page.published,
      score,
      viewCount: page.viewCount,
      wordCount,
      readingTimeMin,
      issues: pageIssues,
    };
  });

  const categoryCounts = new Map<string, number>();
  for (const issue of issues) {
    categoryCounts.set(issue.category, (categoryCounts.get(issue.category) ?? 0) + 1);
  }

  const summary: CategorySummary[] = Object.keys(CATEGORY_META)
    .filter((cat) => (categoryCounts.get(cat) ?? 0) > 0)
    .map((cat) => ({
      category: cat as IssueCategory,
      label: CATEGORY_META[cat]!.label,
      count: categoryCounts.get(cat)!,
      severity: CATEGORY_META[cat]!.severity,
      icon: CATEGORY_META[cat]!.icon,
    }))
    .sort((a, b) => {
      const severityOrder: Record<string, number> = { error: 0, warning: 1, info: 2 };
      return (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2) || b.count - a.count;
    });

  return {
    score: scanResult.healthScore.score,
    totalPages: pages.length,
    totalPagesScanned: pages.length,
    issues,
    summary,
    pageScores,
    scannedAt: scanResult.scannedAt,
  };
}

export function getHealthColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30';
  if (score >= 60) return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30';
  if (score >= 40) return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30';
  return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30';
}

export function getHealthLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Needs Attention';
  return 'Critical';
}

export function getScoreRingColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}
