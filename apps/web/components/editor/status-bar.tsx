'use client';

import type { ViewMode } from './editor-types';

interface StatusBarProps {
  cursorPos: { line: number; col: number } | null;
  charCount: number;
  wordCount: number;
  readingTime: string;
  tags: string[];
  viewMode: ViewMode;
}

export function StatusBar({ cursorPos, charCount, wordCount, readingTime, tags, viewMode }: StatusBarProps) {
  return (
    <div className="shrink-0 flex items-center justify-between border-t border-theme-border px-4 sm:px-6 py-1.5 text-[11px] text-theme-muted">
      <div className="flex items-center gap-4">
        <span>Ln {cursorPos?.line ?? 1}, Col {cursorPos?.col ?? 1}</span>
        <span>{charCount} chars</span>
        <span>{wordCount} words</span>
        <span>{readingTime} min read</span>
      </div>
      <div className="flex items-center gap-3">
        {tags.length > 0 && (
          <div className="flex items-center gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded bg-theme-accent/10 text-theme-accent text-[10px]">
                {tag}
              </span>
            ))}
            {tags.length > 3 && <span>+{tags.length - 3}</span>}
          </div>
        )}
        <span className="px-1.5 py-0.5 rounded bg-theme-hover text-[10px] uppercase tracking-wider">
          {viewMode}
        </span>
      </div>
    </div>
  );
}
