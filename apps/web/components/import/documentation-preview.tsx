'use client';

import { useState, useEffect } from 'react';
import { FileText, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Markdown } from '@/components/markdown';

interface DocumentationPreviewProps {
  projectId: string;
  slug: string | null;
}

export function DocumentationPreview({ projectId, slug }: DocumentationPreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) {
      setContent(null);
      return;
    }

    setLoading(true);
    fetch(`/api/pages?projectId=${projectId}&slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setContent(data.pages?.[0]?.content ?? '');
      })
      .catch(() => setContent('# Error\n\nFailed to load page content.'))
      .finally(() => setLoading(false));
  }, [projectId, slug]);

  if (!slug) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-theme-muted">
        <FileText className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">Select a page to preview</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 text-theme-muted animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme-border">
        <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
          Live Preview
        </h3>
        <Link
          href={`/docs/${projectId}/${slug}`}
          target="_blank"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {content ? (
          <Markdown content={content} />
        ) : (
          <p className="text-theme-muted text-sm italic">No content</p>
        )}
      </div>
    </div>
  );
}
