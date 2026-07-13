'use client';

import { useMemo } from 'react';
import { computeDiff } from '@/lib/diff';
import { Plus, Minus, Equal } from 'lucide-react';

interface DiffViewerProps {
  oldText: string;
  newText: string;
  oldLabel?: string;
  newLabel?: string;
}

export function DiffViewer({ oldText, newText, oldLabel, newLabel }: DiffViewerProps) {
  const diff = useMemo(() => computeDiff(oldText, newText), [oldText, newText]);

  return (
    <div className="rounded-xl border border-theme-border overflow-hidden">
      <div className="flex items-center justify-between border-b border-theme-border bg-theme-card px-4 py-2">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
            <Plus className="h-3 w-3" />
            {diff.added} added
          </span>
          <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <Minus className="h-3 w-3" />
            {diff.removed} removed
          </span>
          <span className="flex items-center gap-1.5 text-theme-muted">
            <Equal className="h-3 w-3" />
            {diff.unchanged} unchanged
          </span>
        </div>
        {(oldLabel || newLabel) && (
          <div className="flex items-center gap-3 text-xs text-theme-muted">
            {oldLabel && <span>{oldLabel}</span>}
            {newLabel && <span>{newLabel}</span>}
          </div>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto font-mono text-sm">
        {diff.lines.length === 0 ? (
          <div className="p-4 text-center text-theme-muted text-sm">
            No changes
          </div>
        ) : (
          diff.lines.map((line, i) => (
            <div
              key={i}
              className={`flex border-b border-theme-border ${
                line.type === 'added'
                  ? 'bg-green-50 dark:bg-green-950/30'
                  : line.type === 'removed'
                  ? 'bg-red-50 dark:bg-red-950/30'
                    : 'bg-theme-page'
              }`}
            >
              <div className="w-12 shrink-0 text-right pr-2 py-1 text-xs text-theme-muted select-none border-r border-theme-border">
                {line.lineNumber}
              </div>
              <div className="w-6 shrink-0 text-center py-1 select-none">
                {line.type === 'added' && (
                  <Plus className="h-3 w-3 text-green-500 dark:text-green-400 mx-auto" />
                )}
                {line.type === 'removed' && (
                  <Minus className="h-3 w-3 text-red-500 dark:text-red-400 mx-auto" />
                )}
              </div>
              <div className="flex-1 py-1 px-2 overflow-x-auto">
                <pre className={`whitespace-pre-wrap ${
                  line.type === 'added'
                    ? 'text-green-800 dark:text-green-300'
                    : line.type === 'removed'
                    ? 'text-red-800 dark:text-red-300'
                    : 'text-theme-subtle'
                }`}>
                  {line.content || ' '}
                </pre>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
