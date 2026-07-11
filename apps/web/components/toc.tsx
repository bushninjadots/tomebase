'use client';

import { ListOrdered } from 'lucide-react';

interface TocItem {
  level: number;
  text: string;
  id: string;
}

export function TableOfContents({ headings }: { headings: TocItem[] }) {
  if (headings.length === 0) return null;

  return (
    <div className="rounded-xl border border-theme-border bg-white p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-theme-muted mb-3">
        <ListOrdered className="h-3 w-3" />
        On this page
      </div>
      <nav className="space-y-0.5">
        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById(h.id);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="block rounded-md px-2 py-1 text-sm text-theme-muted hover:bg-theme-hover hover:text-theme-main transition-colors"
            style={{ paddingLeft: `${8 + (h.level - 1) * 12}px` }}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
