'use client';

import Link from 'next/link';
import { TrendingDown, ArrowUpRight, FileText, Eye, AlertCircle } from 'lucide-react';

interface PageData {
  id: string;
  title: string;
  slug: string;
  score: number;
  wordCount: number;
  viewCount: number;
  issues: unknown[];
  published: boolean;
}

interface PagesNeedingAttentionProps {
  pages: PageData[];
  projectId: string;
}

export function PagesNeedingAttention({ pages, projectId }: PagesNeedingAttentionProps) {
  const worstPages = [...pages]
    .filter((p) => p.score < 100)
    .sort((a, b) => a.score - b.score)
    .slice(0, 10);

  if (worstPages.length === 0) return null;

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card overflow-hidden">
      <div className="px-5 py-4 border-b border-theme-border flex items-center gap-2">
        <TrendingDown className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-theme-main">Pages Needing Attention</h3>
        <span className="ml-auto text-xs text-theme-muted">{worstPages.length} pages</span>
      </div>

      {/* Desktop view */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[1fr_70px_70px_70px_50px] gap-3 px-5 py-2 text-[10px] font-semibold text-theme-muted uppercase tracking-wider border-b border-theme-border bg-theme-page/30">
          <span>Page</span>
          <span className="text-center">Score</span>
          <span className="text-center">Words</span>
          <span className="text-center flex items-center justify-center gap-1"><Eye className="h-2.5 w-2.5" />Views</span>
          <span className="text-center">Issues</span>
        </div>
        <div className="divide-y divide-theme-border">
          {worstPages.map((page) => (
            <Link
              key={page.id}
              href={`/docs/${projectId}/${page.slug}`}
              className="grid grid-cols-[1fr_70px_70px_70px_50px] gap-3 px-5 py-3 text-sm hover:bg-theme-hover/50 transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 text-theme-muted shrink-0" />
                <span className="font-medium text-theme-main truncate group-hover:text-theme-accent transition-colors">
                  {page.title}
                </span>
                {!page.published && (
                  <span className="shrink-0 rounded bg-theme-hover px-1.5 py-0.5 text-[9px] text-theme-muted font-medium">draft</span>
                )}
              </div>
              <div className="flex items-center justify-center">
                <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-bold tabular-nums ${
                  page.score >= 80 ? 'bg-green-500/10 text-green-500' :
                  page.score >= 60 ? 'bg-amber-500/10 text-amber-500' :
                  'bg-red-500/10 text-red-500'
                }`}>
                  {page.score}
                </span>
              </div>
              <div className="flex items-center justify-center text-theme-muted text-xs tabular-nums">{page.wordCount.toLocaleString()}</div>
              <div className="flex items-center justify-center text-theme-muted text-xs tabular-nums">{page.viewCount}</div>
              <div className="flex items-center justify-center text-theme-muted text-xs tabular-nums">{page.issues.length}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile view */}
      <div className="md:hidden divide-y divide-theme-border">
        {worstPages.map((page) => (
          <Link
            key={page.id}
            href={`/docs/${projectId}/${page.slug}`}
            className="px-5 py-3 block hover:bg-theme-hover/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-sm text-theme-main truncate">{page.title}</span>
              <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-bold tabular-nums shrink-0 ml-2 ${
                page.score >= 80 ? 'bg-green-500/10 text-green-500' :
                page.score >= 60 ? 'bg-amber-500/10 text-amber-500' :
                'bg-red-500/10 text-red-500'
              }`}>
                {page.score}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-theme-muted">
              <span className="tabular-nums">{page.wordCount.toLocaleString()} words</span>
              <span className="tabular-nums">{page.viewCount} views</span>
              <span className="tabular-nums">{page.issues.length} issues</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
