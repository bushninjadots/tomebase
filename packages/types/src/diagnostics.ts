export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export type DiagnosticCategory =
  | 'broken_link'
  | 'missing_frontmatter'
  | 'missing_title'
  | 'missing_description'
  | 'missing_owner'
  | 'missing_tags'
  | 'duplicate_title'
  | 'invalid_markdown'
  | 'broken_mermaid'
  | 'broken_image'
  | 'empty_page'
  | 'orphan_page'
  | 'unlinked_page'
  | 'large_page'
  | 'heading_hierarchy'
  | 'multiple_h1'
  | 'duplicate_blank_lines'
  | 'trailing_whitespace'
  | 'markdown_formatting'
  | 'missing_code_block_language'
  | 'stale_docs'
  | 'missing_toc'
  | 'deprecated_syntax'
  | 'missing_blank_line_before_heading'
  | 'missing_blank_line_after_heading'
  | 'inconsistent_list_markers'
  | 'multiple_spaces'
  | 'missing_newline_eof'
  | 'missing_alt_text'
  | 'inconsistent_emphasis'
  | 'space_before_punctuation'
  | 'double_punctuation'
  | 'html_entities'
  | 'missing_space_after_punctuation'
  | 'trailing_punctuation_in_heading'
  | 'blank_line_in_blockquote'
  | 'missing_closing_backtick'
  | 'unspaced_blockquote'
  | 'repeated_words'
  | 'missing_space_around_inline_code'
  | 'heading_ends_with_colon'
  | 'inconsistent_link_style'
  | 'hardcoded_urls'
  | 'horizontal_rule_formatting'
  | 'missing_link_text'
  | 'empty_link_target'
  | 'frontmatter_over_usage';

export interface DiagnosticPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  description: string | null;
  published: boolean;
  viewCount: number;
  lastViewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Diagnostic {
  id: string;
  category: DiagnosticCategory;
  severity: DiagnosticSeverity;
  title: string;
  description: string;
  explanation: string;
  pageId: string;
  pageSlug: string;
  pageTitle: string;
  line: number | null;
  column: number | null;
  rule: string;
  canAutoFix: boolean;
  fixPreview: FixPreview | null;
  aiAvailable: boolean;
  ignored: boolean;
  createdAt: string;
}

export interface FixPreview {
  originalContent: string;
  fixedContent: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface DiagnosticFixResult {
  success: boolean;
  originalContent: string;
  fixedContent: string;
  appliedAt: string;
  diagnosticsResolved: string[];
}

export interface DiagnosticScanResult {
  diagnostics: Diagnostic[];
  healthScore: HealthScore;
  scannedAt: string;
  totalPages: number;
  scanDuration: number;
}

export interface HealthScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  color: string;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  totalIssues: number;
  fixableCount: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: DiagnosticCategory;
  label: string;
  count: number;
  severity: DiagnosticSeverity;
  fixable: number;
}

export interface DiagnosticBatchOperation {
  type: 'fix_all' | 'ignore_selected' | 'ai_review';
  diagnosticIds: string[];
  projectId: string;
}

export interface DiagnosticBatchResult {
  processed: number;
  succeeded: number;
  failed: number;
  results: DiagnosticFixResult[];
}

export interface DiagnosticFilter {
  severity: DiagnosticSeverity | 'all';
  category: DiagnosticCategory | 'all';
  pageId: string | 'all';
  canAutoFix: boolean | null;
  search: string;
}

export interface DiagnosticExportData {
  projectId: string;
  projectName: string;
  healthScore: HealthScore;
  diagnostics: Diagnostic[];
  exportedAt: string;
}
