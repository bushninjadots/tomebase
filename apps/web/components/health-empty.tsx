'use client';

import { CheckCircle2, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface HealthEmptyStateProps {
  projectId: string;
  pageCount: number;
}

export function HealthEmptyState({ projectId, pageCount }: HealthEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-theme-accent-light">
          <Sparkles className="h-4 w-4 text-theme-accent" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-theme-main mb-2">
        Documentation is healthy!
      </h2>
      <p className="text-sm text-theme-subtle max-w-md mb-6">
        All {pageCount} page{pageCount === 1 ? '' : 's'} pass quality checks.
        No broken links, no empty pages, no structural issues detected.
      </p>

      <div className="flex items-center gap-3">
        <Link
          href={`/docs/${projectId}`}
          className="inline-flex items-center gap-2 rounded-xl bg-theme-accent px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors"
        >
          <BookOpen className="h-4 w-4" />
          View Documentation
        </Link>
        <Link
          href={`/docs/${projectId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-theme-border bg-theme-card px-4 py-2.5 text-sm font-medium text-theme-main hover:bg-theme-hover transition-colors"
        >
          Continue Editing
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
