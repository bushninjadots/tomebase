'use client';

import { useState } from 'react';
import type { Diagnostic } from '@fluid/types';
import { CATEGORY_LABELS } from '@/lib/diagnostics/health-score';
import Link from 'next/link';
import {
  AlertTriangle, AlertCircle, Info, Wand2, Eye, EyeOff,
  Sparkles, ExternalLink, ChevronDown, ChevronUp, CircleDot,
  ArrowRight,
} from 'lucide-react';

interface DiagnosticCardProps {
  diagnostic: Diagnostic;
  projectId?: string;
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

export function DiagnosticCard({
  diagnostic,
  projectId,
  onPreview,
  onFix,
  onIgnore,
  onAIAction,
}: DiagnosticCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[diagnostic.severity];

  return (
    <div
      className={`rounded-2xl border ${config.border} ${config.bg} ${config.hoverBorder} transition-all duration-200 overflow-hidden`}
    >
      {/* Main row */}
      <div
        className="px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-1 h-2 w-2 rounded-full ${config.dot} shrink-0`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-theme-main">{diagnostic.title}</span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.badge}`}>
                {diagnostic.severity}
              </span>
              <span className="inline-flex items-center rounded-full bg-theme-surface border border-theme-border px-2 py-0.5 text-[10px] text-theme-muted font-medium">
                {CATEGORY_LABELS[diagnostic.category] || diagnostic.category}
              </span>
              {diagnostic.canAutoFix && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                  <Wand2 className="h-2.5 w-2.5" />
                  Auto-fix
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-theme-subtle line-clamp-2">{diagnostic.description}</p>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-theme-muted">
              {projectId && (
                <Link
                  href={`/docs/${projectId}/${diagnostic.pageSlug}${diagnostic.line ? `?line=${diagnostic.line}` : ''}`}
                  className="flex items-center gap-1 hover:text-theme-accent transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {diagnostic.pageTitle}
                  {diagnostic.line && <span className="text-theme-accent font-medium">L{diagnostic.line}</span>}
                  <ExternalLink className="h-2.5 w-2.5" />
                </Link>
              )}
              {!projectId && (
                <span className="flex items-center gap-1">{diagnostic.pageTitle}</span>
              )}
              {diagnostic.line && (
                <span className="flex items-center gap-1">
                  <CircleDot className="h-3 w-3" />
                  Line {diagnostic.line}
                </span>
              )}
              <span className="font-mono text-[10px] opacity-60">{diagnostic.rule}</span>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-theme-muted shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-theme-border px-5 py-4 bg-theme-page/30 space-y-4">
          {/* Explanation */}
          <div>
            <h4 className="text-xs font-semibold text-theme-main mb-1.5 uppercase tracking-wider">Explanation</h4>
            <p className="text-sm text-theme-subtle leading-relaxed">{diagnostic.explanation}</p>
          </div>

          {/* Fix preview */}
          {diagnostic.fixPreview && (
            <div className="rounded-xl border border-theme-border bg-theme-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-theme-main">Suggested Fix</h4>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  diagnostic.fixPreview.confidence === 'high' ? 'bg-green-500/10 text-green-600' :
                  diagnostic.fixPreview.confidence === 'medium' ? 'bg-amber-500/10 text-amber-600' :
                  'bg-theme-hover text-theme-muted'
                }`}>
                  {diagnostic.fixPreview.confidence} confidence
                </span>
              </div>
              <p className="text-xs text-theme-subtle">{diagnostic.fixPreview.description}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(diagnostic); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-theme-border bg-theme-card px-3.5 py-2 text-xs font-medium text-theme-main hover:bg-theme-hover hover:border-theme-accent/30 transition-all"
            >
              <Eye className="h-3 w-3" />
              Preview Diff
            </button>

            {diagnostic.canAutoFix && (
              <button
                onClick={(e) => { e.stopPropagation(); onFix(diagnostic); }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-green-500/10 border border-green-500/20 px-3.5 py-2 text-xs font-semibold text-green-600 hover:bg-green-500/20 transition-all"
              >
                <Wand2 className="h-3 w-3" />
                Auto Fix
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onIgnore(diagnostic); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-theme-border bg-theme-card px-3.5 py-2 text-xs font-medium text-theme-muted hover:bg-theme-hover transition-all"
            >
              <EyeOff className="h-3 w-3" />
              Ignore
            </button>

            <div className="h-4 w-px bg-theme-border mx-1" />

            <button
              onClick={(e) => { e.stopPropagation(); onAIAction(diagnostic, 'explain'); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-theme-border bg-theme-card px-3.5 py-2 text-xs font-medium text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-all"
            >
              <Sparkles className="h-3 w-3 text-theme-accent" />
              AI Explain
            </button>

            {diagnostic.canAutoFix && (
              <button
                onClick={(e) => { e.stopPropagation(); onAIAction(diagnostic, 'improve'); }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-theme-border bg-theme-card px-3.5 py-2 text-xs font-medium text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-all"
              >
                <Sparkles className="h-3 w-3 text-theme-accent" />
                AI Improve
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onAIAction(diagnostic, 'rewrite'); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-theme-border bg-theme-card px-3.5 py-2 text-xs font-medium text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-all"
            >
              <Sparkles className="h-3 w-3 text-theme-accent" />
              AI Rewrite
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
