import type {
  Diagnostic,
  HealthScore,
  DiagnosticCategory,
  DiagnosticSeverity,
  CategoryBreakdown,
} from '@fluid/types';

const CATEGORY_LABELS: Record<DiagnosticCategory, string> = {
  broken_link: 'Broken Links',
  missing_frontmatter: 'Missing Frontmatter',
  missing_title: 'Missing Title',
  missing_description: 'Missing Description',
  missing_owner: 'Missing Owner',
  missing_tags: 'Missing Tags',
  duplicate_title: 'Duplicate Titles',
  invalid_markdown: 'Invalid Markdown',
  broken_mermaid: 'Broken Mermaid',
  broken_image: 'Broken Images',
  empty_page: 'Empty Pages',
  orphan_page: 'Orphan Pages',
  unlinked_page: 'Unlinked Pages',
  large_page: 'Large Pages',
  heading_hierarchy: 'Heading Hierarchy',
  multiple_h1: 'Multiple H1',
  duplicate_blank_lines: 'Duplicate Blank Lines',
  trailing_whitespace: 'Trailing Whitespace',
  markdown_formatting: 'Markdown Formatting',
  missing_code_block_language: 'Missing Code Language',
  stale_docs: 'Stale Documentation',
  missing_toc: 'Missing Table of Contents',
  deprecated_syntax: 'Deprecated Syntax',
  missing_blank_line_before_heading: 'Missing Blank Line Before Heading',
  missing_blank_line_after_heading: 'Missing Blank Line After Heading',
  inconsistent_list_markers: 'Inconsistent List Markers',
  multiple_spaces: 'Multiple Spaces',
  missing_newline_eof: 'Missing Newline at EOF',
  missing_alt_text: 'Missing Alt Text',
  inconsistent_emphasis: 'Inconsistent Emphasis',
  space_before_punctuation: 'Space Before Punctuation',
  double_punctuation: 'Double Punctuation',
  html_entities: 'HTML Entities',
  missing_space_after_punctuation: 'Missing Space After Punctuation',
  trailing_punctuation_in_heading: 'Trailing Punctuation in Heading',
  blank_line_in_blockquote: 'Blank Line in Blockquote',
  missing_closing_backtick: 'Missing Closing Backtick',
  unspaced_blockquote: 'Unspaced Blockquote',
  repeated_words: 'Repeated Words',
  missing_space_around_inline_code: 'Missing Space Around Inline Code',
  heading_ends_with_colon: 'Heading Ends With Colon',
  inconsistent_link_style: 'Inconsistent Link Style',
  hardcoded_urls: 'Hardcoded URLs',
  horizontal_rule_formatting: 'Horizontal Rule Formatting',
  missing_link_text: 'Missing Link Text',
  empty_link_target: 'Empty Link Target',
  frontmatter_over_usage: 'Excessive Frontmatter',
};

const SEVERITY_WEIGHTS: Record<DiagnosticSeverity, number> = {
  error: 15,
  warning: 8,
  info: 3,
};

export function calculateHealthScore(diagnostics: Diagnostic[]): HealthScore {
  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;
  const infoCount = diagnostics.filter((d) => d.severity === 'info').length;
  const totalIssues = diagnostics.length;
  const fixableCount = diagnostics.filter((d) => d.canAutoFix).length;

  let score = 100;
  for (const d of diagnostics) {
    score -= SEVERITY_WEIGHTS[d.severity];
  }
  score = Math.max(0, Math.min(100, score));

  const categoryBreakdown = calculateCategoryBreakdown(diagnostics);

  return {
    score,
    grade: getGrade(score),
    label: getHealthLabel(score),
    color: getHealthColor(score),
    errorCount,
    warningCount,
    infoCount,
    totalIssues,
    fixableCount,
    categoryBreakdown,
  };
}

function calculateCategoryBreakdown(diagnostics: Diagnostic[]): CategoryBreakdown[] {
  const counts = new Map<DiagnosticCategory, { count: number; fixable: number; severity: DiagnosticSeverity }>();

  for (const d of diagnostics) {
    const existing = counts.get(d.category);
    if (existing) {
      existing.count++;
      if (d.canAutoFix) existing.fixable++;
    } else {
      counts.set(d.category, {
        count: 1,
        fixable: d.canAutoFix ? 1 : 0,
        severity: d.severity,
      });
    }
  }

  return Array.from(counts.entries())
    .map(([category, data]) => ({
      category,
      label: CATEGORY_LABELS[category],
      count: data.count,
      severity: data.severity,
      fixable: data.fixable,
    }))
    .sort((a, b) => {
      const severityOrder: Record<DiagnosticSeverity, number> = { error: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity] || b.count - a.count;
    });
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function getHealthLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Needs Attention';
  return 'Critical';
}

export function getHealthColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'amber';
  if (score >= 40) return 'orange';
  return 'red';
}

export function getGradeColor(grade: 'A' | 'B' | 'C' | 'D' | 'F'): string {
  switch (grade) {
    case 'A': return 'text-green-500';
    case 'B': return 'text-green-400';
    case 'C': return 'text-amber-400';
    case 'D': return 'text-orange-400';
    case 'F': return 'text-red-400';
  }
}
