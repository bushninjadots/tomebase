'use client';

import { CheckCircle, ArrowRight, ExternalLink, RotateCcw, GitBranch, FileCode, Braces, Type, Box, List, Package, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { GenerationResult, ExportKind, GeneratedPage } from './use-import-wizard';
import { GenerationStats } from './generation-stats';

const KIND_CONFIG: Record<ExportKind, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  function: { icon: FileCode, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Function' },
  interface: { icon: Braces, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Interface' },
  type: { icon: Type, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Type' },
  class: { icon: Box, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Class' },
  enum: { icon: List, color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Enum' },
  namespace: { icon: Package, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Namespace' },
};

function PageCard({ page, projectId, index }: { page: GeneratedPage; projectId: string; index: number }) {
  const config = KIND_CONFIG[page.kind] ?? KIND_CONFIG.function;
  const Icon = config.icon;

  return (
    <Link
      href={`/docs/${projectId}/${page.slug}`}
      className="group flex items-start gap-3.5 rounded-xl border border-theme-border bg-theme-card p-4 hover:border-theme-accent/30 hover:bg-theme-hover transition-all"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-4.5 w-4.5 ${config.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-theme-main group-hover:text-theme-accent transition-colors truncate">
            {page.title}
          </p>
          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${config.bg} ${config.color}`}>
            {config.label}
          </span>
        </div>
        {page.description && (
          <p className="text-xs text-theme-muted line-clamp-1">{page.description}</p>
        )}
        <p className="text-[11px] text-theme-muted/60 mt-1">{page.wordCount} words</p>
      </div>
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="h-4 w-4 text-theme-accent" />
      </div>
    </Link>
  );
}

interface ImportSummaryProps {
  result: GenerationResult;
  projectId: string;
  onGenerateMore: () => void;
}

export function ImportSummary({ result, projectId, onGenerateMore }: ImportSummaryProps) {
  return (
    <div className="space-y-6 animate-[slideUp_0.4s_ease-out]">
      <div className="text-center pb-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/10 mb-4">
          <CheckCircle className="h-7 w-7 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-theme-main">Successfully generated documentation</h2>
        <p className="mt-1 text-sm text-theme-muted">
          {result.pages.length} documentation page{result.pages.length === 1 ? '' : 's'} created.
          {result.skipped.length > 0 && (
            <span className="text-amber-400 ml-1">
              {result.skipped.length} skipped (already exist).
            </span>
          )}
        </p>
        <p className="text-xs text-green-400/80 mt-1">Everything imported successfully.</p>
      </div>

      {result.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-medium text-amber-400">Warnings</h3>
          </div>
          <div className="space-y-1">
            {result.warnings.map((w, i) => (
              <p key={i} className="text-xs text-theme-muted">{w}</p>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2.5 card-stagger">
        {result.pages.map((page, i) => (
          <PageCard key={page.id} page={page} projectId={projectId} index={i} />
        ))}
      </div>

      <GenerationStats stats={result.stats} />

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/docs/${projectId}/${result.pages[0]?.slug}`}
          className="inline-flex items-center gap-2 rounded-lg bg-theme-accent text-gray-900 px-5 py-2.5 text-sm font-semibold hover:bg-theme-accent-hover transition-colors"
        >
          Open Generated Pages
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={`/docs/${projectId}`}
          className="inline-flex items-center gap-2 rounded-lg border border-theme-border bg-theme-card px-4 py-2.5 text-sm font-medium text-theme-main hover:bg-theme-hover transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Project
        </Link>
        <button
          onClick={onGenerateMore}
          className="inline-flex items-center gap-2 rounded-lg border border-theme-border bg-theme-card px-4 py-2.5 text-sm font-medium text-theme-main hover:bg-theme-hover transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Generate More
        </button>
        <Link
          href={`/docs/${projectId}/graph`}
          className="inline-flex items-center gap-2 rounded-lg border border-theme-border bg-theme-card px-4 py-2.5 text-sm font-medium text-theme-main hover:bg-theme-hover transition-colors"
        >
          <GitBranch className="h-3.5 w-3.5" />
          Open Graph View
        </Link>
      </div>
    </div>
  );
}
