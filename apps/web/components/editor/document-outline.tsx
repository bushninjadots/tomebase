'use client';

import { useMemo } from 'react';
import { ListOrdered, Hash } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface DocumentOutlineProps {
  content: string;
  activeHeadingId?: string;
}

function extractHeadingsFromContent(content: string): Heading[] {
  const headings: Heading[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      const level = match[1]!.length;
      const text = match[2]!.trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      headings.push({ id, text, level });
    }
  }

  return headings;
}

export function DocumentOutline({ content, activeHeadingId }: DocumentOutlineProps) {
  const headings = useMemo(() => extractHeadingsFromContent(content), [content]);

  if (headings.length === 0) {
    return (
      <div className="rounded-xl border border-theme-border bg-theme-card p-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-theme-muted mb-3">
          <ListOrdered className="h-3 w-3" />
          Document Outline
        </div>
        <p className="text-xs text-theme-muted/60 italic">
          Add headings (H1-H6) to see the document outline
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-theme-border bg-theme-card p-4 sticky top-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-theme-muted mb-3">
        <ListOrdered className="h-3 w-3" />
        Document Outline
      </div>
      <nav className="space-y-0.5">
        {headings.map((heading) => {
          const isActive = heading.id === activeHeadingId;
          return (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(heading.id);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all ${
                isActive
                  ? 'bg-theme-accent/10 text-theme-accent font-medium'
                  : 'text-theme-muted hover:bg-theme-hover hover:text-theme-subtle'
              }`}
              style={{ paddingLeft: `${8 + (heading.level - 1) * 12}px` }}
            >
              <Hash className="h-3 w-3 shrink-0 opacity-40" />
              <span className="truncate">{heading.text}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
