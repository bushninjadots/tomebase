import type {
  Diagnostic,
  HealthScore,
  DiagnosticCategory,
  DiagnosticSeverity,
  CategoryBreakdown,
} from '@fluid/types';

export const CATEGORY_LABELS: Record<DiagnosticCategory, string> = {
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
  table_missing_header: 'Table Missing Header',
  table_inconsistent_columns: 'Inconsistent Table Columns',
  mermaid_syntax: 'Mermaid Syntax Issues',
  low_link_density: 'Low Link Density',
  high_link_density: 'High Link Density',
  imported_code_stale: 'Stale Imported Code',
  code_language_diversity: 'Code Language Diversity',
  orphan_section: 'Orphan Section',
  structure_depth: 'Deep Structure',
  missing_code_examples: 'Missing Code Examples',
  too_many_diagrams: 'Too Many Diagrams',
  missing_related_pages: 'Missing Related Pages',
  content_distribution: 'Content Distribution',
  low_readability: 'Low Readability',
  wall_of_text: 'Wall of Text',
  missing_h1: 'Missing H1 Heading',
  link_text_generic: 'Generic Link Text',
  long_slug: 'Long Slug',
  excessive_headings: 'Excessive Headings',
  long_paragraph: 'Long Paragraph',
  deep_nesting: 'Deep Nesting',
};

// Severity weights — how many points each issue type costs
// Using diminishing returns: first N issues cost full weight, extras cost less
const SEVERITY_WEIGHTS: Record<DiagnosticSeverity, number> = {
  error: 12,
  warning: 6,
  info: 2,
};

// Category-specific criticality multipliers
const CATEGORY_MULTIPLIER: Partial<Record<DiagnosticCategory, number>> = {
  broken_link: 1.5,
  broken_image: 1.5,
  empty_page: 1.3,
  orphan_page: 1.1,
  missing_frontmatter: 1.2,
  missing_title: 1.2,
  invalid_markdown: 1.1,
  stale_docs: 0.9,
  large_page: 0.8,
};

export function calculateHealthScore(diagnostics: Diagnostic[]): HealthScore {
  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;
  const infoCount = diagnostics.filter((d) => d.severity === 'info').length;
  const totalIssues = diagnostics.length;
  const fixableCount = diagnostics.filter((d) => d.canAutoFix).length;

  // Score starts at 100, subtract points for each diagnostic
  // Use diminishing returns: count issues per severity, apply logarithmic scaling
  let score = 100;

  const severityCounts: Record<DiagnosticSeverity, number> = { error: 0, warning: 0, info: 0 };
  for (const d of diagnostics) {
    severityCounts[d.severity]++;
  }

  // Apply diminishing returns per severity level
  for (const severity of ['error', 'warning', 'info'] as DiagnosticSeverity[]) {
    const count = severityCounts[severity];
    const baseWeight = SEVERITY_WEIGHTS[severity];
    for (let i = 0; i < count; i++) {
      // Diminishing returns: each subsequent issue of same severity costs 15% less (min 25%)
      const diminishingFactor = Math.max(0.25, 1 - i * 0.15);
      score -= baseWeight * diminishingFactor;
    }
  }

  // Apply category multipliers for critical categories
  for (const d of diagnostics) {
    const multiplier = CATEGORY_MULTIPLIER[d.category] ?? 1;
    if (multiplier !== 1) {
      const baseCost = SEVERITY_WEIGHTS[d.severity] * 0.3; // 30% of base weight as category penalty
      score -= baseCost * (multiplier - 1);
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

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
      // Track highest severity seen in this category
      const severityOrder = { error: 0, warning: 1, info: 2 };
      if (severityOrder[d.severity] < severityOrder[existing.severity]) {
        existing.severity = d.severity;
      }
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
      label: CATEGORY_LABELS[category] || category,
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
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
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

export function getHealthTailwindColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30';
  if (score >= 60) return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30';
  if (score >= 40) return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30';
  return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30';
}

export function getScoreRingColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
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
