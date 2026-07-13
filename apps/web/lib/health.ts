import { extractWikiLinks } from './wiki';

export type IssueSeverity = 'error' | 'warning' | 'info';
export type IssueCategory =
  | 'broken_link'
  | 'orphan'
  | 'empty'
  | 'stale'
  | 'low_engagement'
  | 'no_headings'
  | 'no_code_blocks'
  | 'missing_language_tag'
  | 'long_paragraph'
  | 'no_lists'
  | 'thin_content'
  | 'reading_time'
  | 'duplicate_title'
  | 'missing_description'
  | 'missing_params'
  | 'missing_returns'
  | 'naming_inconsistency';

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

const CATEGORY_META: Record<IssueCategory, { label: string; severity: IssueSeverity; icon: string }> = {
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
  naming_inconsistency: { label: 'Naming Inconsistency', severity: 'info',   icon: 'ALargeSmall' },
};

let issueCounter = 0;
function makeIssue(
  category: IssueCategory,
  pageTitle: string,
  pageId: string,
  pageSlug: string,
  message: string,
): HealthIssue {
  issueCounter++;
  const meta = CATEGORY_META[category];
  return {
    id: `issue-${issueCounter}`,
    category,
    severity: meta.severity,
    pageTitle,
    pageId,
    pageSlug,
    message,
  };
}

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
  issueCounter = 0;
  const issues: HealthIssue[] = [];

  const pageTitles = new Set(pages.map((p) => p.title.toLowerCase()));
  const inboundLinkCounts = new Map<string, number>();
  for (const p of pages) inboundLinkCounts.set(p.title.toLowerCase(), 0);

  for (const page of pages) {
    const links = extractWikiLinks(page.content);
    for (const link of links) {
      const normalized = link.toLowerCase();
      const existing = inboundLinkCounts.get(normalized);
      if (existing !== undefined) {
        inboundLinkCounts.set(normalized, existing + 1);
      }
      if (!pageTitles.has(normalized)) {
        issues.push(makeIssue('broken_link', page.title, page.id, page.slug, `Link to "${link}" points to a page that doesn't exist`));
      }
    }
  }

  const pageScores: PageScore[] = pages.map((page) => {
    const pageIssues: HealthIssue[] = [];
    const content = page.content || '';
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

    if (!content || content.trim().length === 0) {
      pageIssues.push(makeIssue('empty', page.title, page.id, page.slug, 'Page has no content'));
    }

    if (content.trim().length > 0 && content.trim().length < 200) {
      pageIssues.push(makeIssue('thin_content', page.title, page.id, page.slug, `Page has only ${content.trim().length} characters (minimum recommended: 200)`));
    }

    const inboundLinks = inboundLinkCounts.get(page.title.toLowerCase()) ?? 0;
    if (inboundLinks === 0 && pages.length > 1) {
      pageIssues.push(makeIssue('orphan', page.title, page.id, page.slug, 'No other pages link to this page'));
    }

    const daysSinceUpdate = Math.floor((Date.now() - new Date(page.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate > 90) {
      pageIssues.push(makeIssue('stale', page.title, page.id, page.slug, `Not updated in ${daysSinceUpdate} days (critical: >90)`));
    } else if (daysSinceUpdate > 30) {
      pageIssues.push(makeIssue('stale', page.title, page.id, page.slug, `Not updated in ${daysSinceUpdate} days`));
    }

    if (page.viewCount < 5 && page.published) {
      pageIssues.push(makeIssue('low_engagement', page.title, page.id, page.slug, `Only ${page.viewCount} view${page.viewCount === 1 ? '' : 's'}`));
    }

    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    if (headings.length === 0 && content.length > 100) {
      pageIssues.push(makeIssue('no_headings', page.title, page.id, page.slug, 'Page has no headings for navigation'));
    }

    const titleCounts = new Map<string, string[]>();
    for (const p of pages) {
      const key = p.title.toLowerCase().trim();
      const existing = titleCounts.get(key) ?? [];
      existing.push(p.id);
      titleCounts.set(key, existing);
    }
    const titleDuplicates = titleCounts.get(page.title.toLowerCase().trim());
    if (titleDuplicates && titleDuplicates.length > 1 && titleDuplicates[0] === page.id) {
      pageIssues.push(makeIssue('duplicate_title', page.title, page.id, page.slug, `${titleDuplicates.length} pages share the same title`));
    }

    const afterTitle = content.replace(/^#\s+.+\n?/, '').trim();
    const firstLine = afterTitle.split('\n')[0] ?? '';
    if (firstLine.length < 10 && content.length > 100) {
      pageIssues.push(makeIssue('missing_description', page.title, page.id, page.slug, 'Page has no description after the title heading'));
    }

    const hasParamDoc = /@param\s+\w+/.test(content) || /\*\s+\w+\s*[:–-]/.test(content);
    const hasReturnDoc = /@returns?\s/.test(content) || /returns?\s*[:–-]/i.test(content);
    if (hasParamDoc && !hasReturnDoc) {
      pageIssues.push(makeIssue('missing_returns', page.title, page.id, page.slug, 'Parameters documented but no return value documentation'));
    }

    const hasCodeTerms = /\b(function|class|interface|type|const|let|var|export|import|from|module)\b/.test(content);
    const hasParamSection = /##?\s*(Parameters|Arguments|Options|Props|Input)/i.test(content);
    if (hasCodeTerms && !hasParamSection && wordCount > 200) {
      pageIssues.push(makeIssue('missing_params', page.title, page.id, page.slug, 'Code documentation may be missing a parameters section'));
    }

    const inconsistentCasing = /\b[A-Z][a-z]+[A-Z]\w*\b/.test(page.title) && /[a-z][A-Z]/.test(page.title);
    const allLowerTitle = page.title === page.title.toLowerCase();
    const allUpperTitle = page.title === page.title.toUpperCase();
    if (allLowerTitle && page.title.length > 3) {
      pageIssues.push(makeIssue('naming_inconsistency', page.title, page.id, page.slug, 'Title is all lowercase — consider Title Case for consistency'));
    }

    const codeBlocks = content.match(/```/g) || [];
    const codeBlockCount = Math.floor(codeBlocks.length / 2);
    if (codeBlockCount === 0 && content.length > 500) {
      pageIssues.push(makeIssue('no_code_blocks', page.title, page.id, page.slug, 'Page has no code examples or snippets'));
    }

    const fenceLines = content.match(/^```\w*\s*$/gm) || [];
    let untaggedCount = 0;
    for (let i = 0; i < fenceLines.length - 1; i += 2) {
      const openFence = fenceLines[i]!;
      if (!openFence.match(/^```\w+/)) {
        untaggedCount++;
      }
    }
    if (untaggedCount > 0) {
      pageIssues.push(makeIssue('missing_language_tag', page.title, page.id, page.slug, `${untaggedCount} code block${untaggedCount === 1 ? '' : 's'} missing language tag`));
    }

    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);
    const longParagraphs = paragraphs.filter((p) => p.split(/\s+/).length > 300);
    if (longParagraphs.length > 0) {
      pageIssues.push(makeIssue('long_paragraph', page.title, page.id, page.slug, `${longParagraphs.length} paragraph${longParagraphs.length === 1 ? '' : 's'} exceed 300 words`));
    }

    const listItems = content.match(/^[\s]*[-*+]\s+/gm) || [];
    const numberedItems = content.match(/^[\s]*\d+\.\s+/gm) || [];
    if (listItems.length === 0 && numberedItems.length === 0 && content.length > 1000) {
      pageIssues.push(makeIssue('no_lists', page.title, page.id, page.slug, 'Long page with no lists for readability'));
    }

    issues.push(...pageIssues);

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

  const categoryCounts = new Map<IssueCategory, number>();
  for (const issue of issues) {
    categoryCounts.set(issue.category, (categoryCounts.get(issue.category) ?? 0) + 1);
  }

  const summary: CategorySummary[] = (Object.keys(CATEGORY_META) as IssueCategory[])
    .filter((cat) => (categoryCounts.get(cat) ?? 0) > 0)
    .map((cat) => ({
      category: cat,
      label: CATEGORY_META[cat].label,
      count: categoryCounts.get(cat)!,
      severity: CATEGORY_META[cat].severity,
      icon: CATEGORY_META[cat].icon,
    }))
    .sort((a, b) => {
      const severityOrder: Record<IssueSeverity, number> = { error: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity] || b.count - a.count;
    });

  const avgPageScore = pageScores.length > 0
    ? Math.round(pageScores.reduce((sum, p) => sum + p.score, 0) / pageScores.length)
    : 100;

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const totalIssues = issues.length;

  let score = avgPageScore;
  if (totalIssues > 0) {
    const errorPenalty = Math.min(30, errorCount * 5);
    const warningPenalty = Math.min(15, warningCount * 2);
    score = Math.max(0, Math.min(100, score - errorPenalty - warningPenalty));
  }

  return {
    score,
    totalPages: pages.length,
    totalPagesScanned: pages.length,
    issues,
    summary,
    pageScores,
    scannedAt: new Date().toISOString(),
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
