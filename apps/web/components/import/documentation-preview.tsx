'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText } from 'lucide-react';
import { Markdown } from '@/components/markdown';

interface DocumentationPreviewProps {
  projectId: string;
  slug: string | null;
}

function PreviewSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-48 bg-theme-hover rounded-lg" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-theme-hover rounded" />
        <div className="h-4 w-5/6 bg-theme-hover rounded" />
        <div className="h-4 w-4/6 bg-theme-hover rounded" />
      </div>
      <div className="h-px bg-theme-border my-4" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-theme-hover rounded" />
        <div className="h-4 w-3/4 bg-theme-hover rounded" />
      </div>
      <div className="rounded-lg bg-theme-hover/50 border border-theme-border p-3 space-y-2">
        <div className="h-3 w-24 bg-theme-hover rounded" />
        <div className="h-3 w-3/4 bg-theme-hover rounded" />
        <div className="h-3 w-1/2 bg-theme-hover rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-theme-hover rounded" />
        <div className="h-4 w-5/6 bg-theme-hover rounded" />
      </div>
    </div>
  );
}

export function DocumentationPreview({ projectId, slug }: DocumentationPreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayedSlug, setDisplayedSlug] = useState<string | null>(null);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!slug) {
      setContent(null);
      setDisplayedSlug(null);
      return;
    }

    if (slug === displayedSlug) return;

    setFading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();

    timerRef.current = setTimeout(() => {
      setLoading(true);
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(`/api/pages?projectId=${projectId}&slug=${slug}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setContent(data[0]?.content ?? '');
          } else {
            setContent(data.pages?.[0]?.content ?? data.content ?? '');
          }
          setDisplayedSlug(slug);
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') {
            setContent('# Error\n\nFailed to load page content.');
          }
        })
        .finally(() => {
          setLoading(false);
          setFading(false);
        });
    }, 100);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [projectId, slug, displayedSlug]);

  if (!slug && !displayedSlug) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-theme-muted">
        <div className="w-12 h-12 rounded-xl bg-theme-hover flex items-center justify-center mb-3">
          <FileText className="h-5 w-5 opacity-40" />
        </div>
        <p className="text-sm font-medium">Select a page to preview</p>
        <p className="text-xs text-theme-muted/60 mt-1">Click any page in the list</p>
      </div>
    );
  }

  return (
    <div className={`transition-opacity duration-150 ${fading ? 'opacity-40' : 'opacity-100'}`}>
      {loading ? (
        <PreviewSkeleton />
      ) : content ? (
        <Markdown content={content} />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-theme-muted">
          <FileText className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-sm">No content</p>
        </div>
      )}
    </div>
  );
}
