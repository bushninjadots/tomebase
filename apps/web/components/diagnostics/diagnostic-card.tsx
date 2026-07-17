'use client';

import { useState } from 'react';
import type { Diagnostic } from '@fluid/types';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Wand2,
  Eye,
  EyeOff,
  Sparkles,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CircleDot,
} from 'lucide-react';

interface DiagnosticCardProps {
  diagnostic: Diagnostic;
  onPreview: (diagnostic: Diagnostic) => void;
  onFix: (diagnostic: Diagnostic) => void;
  onIgnore: (diagnostic: Diagnostic) => void;
  onAIAction: (diagnostic: Diagnostic, action: string) => void;
}

const SEVERITY_CONFIG = {
  error: {
    icon: AlertCircle,
    badge: 'bg-red-500/10 text-red-500 border-red-500/20',
    border: 'border-red-500/20',
    bg: 'bg-red-500/5',
    hoverBorder: 'hover:border-red-500/30',
    dot: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    hoverBorder: 'hover:border-amber-500/30',
    dot: 'bg-amber-500',
  },
  info: {
    icon: Info,
    badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5',
    hoverBorder: 'hover:border-blue-500/30',
    dot: 'bg-blue-500',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  broken_link: 'Broken Link',
  missing_frontmatter: 'Missing Frontmatter',
  missing_title: 'Missing Title',
  missing_description: 'Missing Description',
  missing_owner: 'Missing Owner',
  missing_tags: 'Missing Tags',
  duplicate_title: 'Duplicate Title',
  invalid_markdown: 'Invalid Markdown',
  broken_mermaid: 'Broken Mermaid',
  broken_image: 'Broken Image',
  empty_page: 'Empty Page',
  orphan_page: 'Orphan Page',
  unlinked_page: 'Unlinked Page',
  large_page: 'Large Page',
  heading_hierarchy: 'Heading Hierarchy',
  multiple_h1: 'Multiple H1',
  duplicate_blank_lines: 'Duplicate Blank Lines',
  trailing_whitespace: 'Trailing Whitespace',
  markdown_formatting: 'Formatting',
  missing_code_block_language: 'Missing Language',
  stale_docs: 'Stale Docs',
  missing_toc: 'Missing TOC',
  deprecated_syntax: 'Deprecated Syntax',
};

export function DiagnosticCard({
  diagnostic,
  onPreview,
  onFix,
  onIgnore,
  onAIAction,
}: DiagnosticCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[diagnostic.severity];
  const SeverityIcon = config.icon;

  return (
    <div
      className={`rounded-xl border ${config.border} ${config.bg} ${config.hoverBorder} transition-all duration-200 overflow-hidden`}
    >
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 h-2 w-2 rounded-full ${config.dot} shrink-0`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-theme-main">
                {diagnostic.title}
              </span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${config.badge}`}>
                {diagnostic.severity}
              </span>
              <span className="inline-flex items-center rounded-full bg-theme-surface border border-theme-border px-2 py-0.5 text-[10px] text-theme-muted">
                {CATEGORY_LABELS[diagnostic.category] || diagnostic.category}
              </span>
              {diagnostic.canAutoFix && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] text-green-600">
                  <Wand2 className="h-2.5 w-2.5" />
                  Auto-fix
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-theme-subtle line-clamp-2">
              {diagnostic.description}
            </p>

            <div className="mt-2 flex items-center gap-3 text-[11px] text-theme-muted">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {diagnostic.pageTitle}
              </span>
              {diagnostic.line && (
                <span className="flex items-center gap-1">
                  <CircleDot className="h-3 w-3" />
                  Line {diagnostic.line}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="font-mono text-[10px]">{diagnostic.rule}</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 p-1 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-theme-border px-4 py-3 bg-theme-page/30 space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-theme-main mb-1">Explanation</h4>
            <p className="text-xs text-theme-subtle leading-relaxed">
              {diagnostic.explanation}
            </p>
          </div>

          {diagnostic.fixPreview && (
            <div>
              <h4 className="text-xs font-semibold text-theme-main mb-1">
                Suggested Fix
                <span className={`ml-1.5 font-normal ${
                  diagnostic.fixPreview.confidence === 'high'
                    ? 'text-green-500'
                    : diagnostic.fixPreview.confidence === 'medium'
                    ? 'text-amber-500'
                    : 'text-theme-muted'
                }`}>
                  ({diagnostic.fixPreview.confidence} confidence)
                </span>
              </h4>
              <p className="text-xs text-theme-subtle">
                {diagnostic.fixPreview.description}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={() => onPreview(diagnostic)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-3 py-1.5 text-xs font-medium text-theme-main hover:bg-theme-hover hover:border-theme-accent/30 transition-all"
            >
              <Eye className="h-3 w-3" />
              Preview
            </button>

            {diagnostic.canAutoFix && (
              <button
                onClick={() => onFix(diagnostic)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-500/20 transition-all"
              >
                <Wand2 className="h-3 w-3" />
                Auto Fix
              </button>
            )}

            <button
              onClick={() => onIgnore(diagnostic)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-3 py-1.5 text-xs font-medium text-theme-muted hover:bg-theme-hover transition-all"
            >
              <EyeOff className="h-3 w-3" />
              Ignore
            </button>

            <div className="h-4 w-px bg-theme-border" />

            <button
              onClick={() => onAIAction(diagnostic, 'explain')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-3 py-1.5 text-xs font-medium text-theme-muted hover:bg-theme-hover transition-all opacity-60"
              title="No AI provider configured"
            >
              <Sparkles className="h-3 w-3" />
              AI Explain
              <span className="text-[10px] text-theme-muted">(Soon)</span>
            </button>

            {diagnostic.canAutoFix && (
              <button
                onClick={() => onAIAction(diagnostic, 'improve')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-3 py-1.5 text-xs font-medium text-theme-muted hover:bg-theme-hover transition-all opacity-60"
                title="No AI provider configured"
              >
                <Sparkles className="h-3 w-3" />
                AI Improve
                <span className="text-[10px] text-theme-muted">(Soon)</span>
              </button>
            )}

            <button
              onClick={() => onAIAction(diagnostic, 'rewrite')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-3 py-1.5 text-xs font-medium text-theme-muted hover:bg-theme-hover transition-all opacity-60"
              title="No AI provider configured"
            >
              <Sparkles className="h-3 w-3" />
              AI Rewrite
              <span className="text-[10px] text-theme-muted">(Soon)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
