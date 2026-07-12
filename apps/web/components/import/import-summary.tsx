'use client';

import { CheckCircle, ArrowRight, ExternalLink, RotateCcw, GitBranch } from 'lucide-react';
import Link from 'next/link';
import type { GenerationResult } from './use-import-wizard';
import { GenerationStats } from './generation-stats';

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
        <h2 className="text-xl font-bold text-theme-main">Documentation Generated</h2>
        <p className="mt-1 text-sm text-theme-muted">
          Created {result.pages.length} documentation page{result.pages.length === 1 ? '' : 's'}
          {result.skipped > 0 && (
            <span className="text-amber-400 ml-1">
              · {result.skipped} skipped (already exist)
            </span>
          )}
        </p>
      </div>

      <div className="rounded-xl border border-theme-border bg-theme-card p-4">
        <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-3">
          Generated Pages
        </h3>
        <div className="space-y-1">
          {result.pages.map((page) => (
            <Link
              key={page.id}
              href={`/docs/${projectId}/${page.slug}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-theme-hover transition-colors group"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-theme-accent shrink-0" />
              <span className="text-sm text-theme-main group-hover:text-theme-accent transition-colors truncate">
                {page.title}
              </span>
              <ArrowRight className="h-3 w-3 text-theme-muted opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
            </Link>
          ))}
        </div>
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
