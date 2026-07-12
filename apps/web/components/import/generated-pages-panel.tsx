'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, ArrowUpRight, ExternalLink, GitBranch, Clock, Check } from 'lucide-react';
import type { GeneratedPage } from './use-import-wizard';

interface GeneratedPagesPanelProps {
  pages: GeneratedPage[];
  projectId: string;
}

export function GeneratedPagesPanel({ pages, projectId }: GeneratedPagesPanelProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(pages[0]?.slug ?? null);
  const [pageContents, setPageContents] = useState<Map<string, string>>(new Map());
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  useEffect(() => {
    if (pages.length > 0 && !selectedSlug) {
      setSelectedSlug(pages[0]?.slug ?? null);
    }
  }, [pages, selectedSlug]);

  useEffect(() => {
    if (!selectedSlug || pageContents.has(selectedSlug)) return;
    setLoadingSlug(selectedSlug);
    fetch(`/api/pages?projectId=${projectId}&slug=${selectedSlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.pages?.[0]?.content) {
          setPageContents((prev) => new Map(prev).set(selectedSlug, data.pages[0].content));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSlug(null));
  }, [selectedSlug, projectId, pageContents]);

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
          Generated Pages ({pages.length})
        </h3>
        <div className="flex gap-1.5">
          <Link
            href={`/docs/${projectId}`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Editor
          </Link>
          <Link
            href={`/docs/${projectId}/graph`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-colors"
          >
            <GitBranch className="h-3 w-3" />
            Graph
          </Link>
        </div>
      </div>

      <div className="space-y-0.5 overflow-y-auto flex-1 -mx-1 px-1">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setSelectedSlug(page.slug)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
              selectedSlug === page.slug
                ? 'bg-theme-accent/10 border border-theme-accent/20'
                : 'hover:bg-theme-hover border border-transparent'
            }`}
          >
            <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
              selectedSlug === page.slug
                ? 'bg-theme-accent/20'
                : 'bg-theme-card border border-theme-border'
            }`}>
              <FileText className={`h-3.5 w-3.5 ${
                selectedSlug === page.slug ? 'text-theme-accent' : 'text-theme-muted'
              }`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium truncate ${
                selectedSlug === page.slug ? 'text-theme-accent' : 'text-theme-main'
              }`}>
                {page.title}
              </p>
            </div>
            {selectedSlug === page.slug && (
              <Check className="h-3.5 w-3.5 text-theme-accent shrink-0" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-theme-border">
        <div className="flex items-center gap-1.5 text-[11px] text-theme-muted">
          <Clock className="h-3 w-3" />
          Click any page to preview
        </div>
      </div>
    </div>
  );
}
