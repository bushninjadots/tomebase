'use client';

import type { DiagnosticSeverity, DiagnosticCategory, DiagnosticFilter } from '@fluid/types';
import {
  Search,
  Filter,
  X,
  AlertCircle,
  AlertTriangle,
  Info,
  Wand2,
} from 'lucide-react';

interface DiagnosticFiltersProps {
  filter: DiagnosticFilter;
  onFilterChange: (filter: DiagnosticFilter) => void;
  totalCount: number;
  filteredCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  fixableCount: number;
}

const SEVERITY_OPTIONS: { value: DiagnosticSeverity | 'all'; label: string }[] = [
  { value: 'all', label: 'All Severities' },
  { value: 'error', label: 'Errors' },
  { value: 'warning', label: 'Warnings' },
  { value: 'info', label: 'Info' },
];

const CATEGORY_OPTIONS: { value: DiagnosticCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'broken_link', label: 'Broken Links' },
  { value: 'missing_frontmatter', label: 'Missing Frontmatter' },
  { value: 'missing_title', label: 'Missing Title' },
  { value: 'missing_description', label: 'Missing Description' },
  { value: 'missing_owner', label: 'Missing Owner' },
  { value: 'missing_tags', label: 'Missing Tags' },
  { value: 'duplicate_title', label: 'Duplicate Titles' },
  { value: 'invalid_markdown', label: 'Invalid Markdown' },
  { value: 'broken_mermaid', label: 'Broken Mermaid' },
  { value: 'broken_image', label: 'Broken Images' },
  { value: 'empty_page', label: 'Empty Pages' },
  { value: 'orphan_page', label: 'Orphan Pages' },
  { value: 'unlinked_page', label: 'Unlinked Pages' },
  { value: 'large_page', label: 'Large Pages' },
  { value: 'heading_hierarchy', label: 'Heading Hierarchy' },
  { value: 'multiple_h1', label: 'Multiple H1' },
  { value: 'duplicate_blank_lines', label: 'Duplicate Blank Lines' },
  { value: 'trailing_whitespace', label: 'Trailing Whitespace' },
  { value: 'markdown_formatting', label: 'Formatting' },
  { value: 'missing_code_block_language', label: 'Missing Code Language' },
  { value: 'stale_docs', label: 'Stale Docs' },
  { value: 'missing_toc', label: 'Missing TOC' },
  { value: 'deprecated_syntax', label: 'Deprecated Syntax' },
];

export function DiagnosticFilters({
  filter,
  onFilterChange,
  totalCount,
  filteredCount,
  errorCount,
  warningCount,
  infoCount,
  fixableCount,
}: DiagnosticFiltersProps) {
  const hasActiveFilters =
    filter.severity !== 'all' ||
    filter.category !== 'all' ||
    filter.canAutoFix !== null ||
    filter.search !== '';

  function updateFilter(partial: Partial<DiagnosticFilter>) {
    onFilterChange({ ...filter, ...partial });
  }

  function clearFilters() {
    onFilterChange({
      severity: 'all',
      category: 'all',
      pageId: 'all',
      canAutoFix: null,
      search: '',
    });
  }

  return (
    <div className="space-y-3">
      {/* Severity Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-theme-border bg-theme-card p-1">
        <button
          onClick={() => updateFilter({ severity: 'all' })}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            filter.severity === 'all'
              ? 'bg-theme-accent-light text-theme-accent'
              : 'text-theme-muted hover:text-theme-main hover:bg-theme-hover'
          }`}
        >
          All
          <span className="text-[10px] opacity-70">{totalCount}</span>
        </button>
        <button
          onClick={() => updateFilter({ severity: 'error' })}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            filter.severity === 'error'
              ? 'bg-red-500/10 text-red-500'
              : 'text-theme-muted hover:text-theme-main hover:bg-theme-hover'
          }`}
        >
          <AlertCircle className="h-3 w-3" />
          Errors
          <span className="text-[10px] opacity-70">{errorCount}</span>
        </button>
        <button
          onClick={() => updateFilter({ severity: 'warning' })}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            filter.severity === 'warning'
              ? 'bg-amber-500/10 text-amber-500'
              : 'text-theme-muted hover:text-theme-main hover:bg-theme-hover'
          }`}
        >
          <AlertTriangle className="h-3 w-3" />
          Warnings
          <span className="text-[10px] opacity-70">{warningCount}</span>
        </button>
        <button
          onClick={() => updateFilter({ severity: 'info' })}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            filter.severity === 'info'
              ? 'bg-blue-500/10 text-blue-500'
              : 'text-theme-muted hover:text-theme-main hover:bg-theme-hover'
          }`}
        >
          <Info className="h-3 w-3" />
          Info
          <span className="text-[10px] opacity-70">{infoCount}</span>
        </button>
      </div>

      {/* Search + Filters Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-theme-muted" />
          <input
            type="text"
            placeholder="Search diagnostics..."
            value={filter.search}
            onChange={(e) => updateFilter({ search: e.target.value })}
            className="w-full rounded-lg border border-theme-border bg-theme-card pl-9 pr-3 py-2 text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-accent/40 focus:ring-1 focus:ring-theme-accent/20 transition-all"
          />
          {filter.search && (
            <button
              onClick={() => updateFilter({ search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-theme-muted hover:text-theme-main"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <select
          value={filter.category}
          onChange={(e) => updateFilter({ category: e.target.value as DiagnosticCategory | 'all' })}
          className="rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-accent/40 focus:ring-1 focus:ring-theme-accent/20 transition-all appearance-none cursor-pointer"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={() =>
            updateFilter({
              canAutoFix: filter.canAutoFix === true ? null : true,
            })
          }
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
            filter.canAutoFix === true
              ? 'border-green-500/30 bg-green-500/10 text-green-600'
              : 'border-theme-border bg-theme-card text-theme-muted hover:text-theme-main hover:bg-theme-hover'
          }`}
        >
          <Wand2 className="h-3 w-3" />
          Fixable
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-xs text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-all"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <div className="text-[11px] text-theme-muted">
          Showing {filteredCount} of {totalCount} diagnostics
        </div>
      )}
    </div>
  );
}
