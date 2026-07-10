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
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-green-600">
            <Plus className="h-3 w-3" />
            {diff.added} added
          </span>
          <span className="flex items-center gap-1.5 text-red-600">
            <Minus className="h-3 w-3" />
            {diff.removed} removed
          </span>
          <span className="flex items-center gap-1.5 text-gray-500">
            <Equal className="h-3 w-3" />
            {diff.unchanged} unchanged
          </span>
        </div>
        {(oldLabel || newLabel) && (
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {oldLabel && <span>{oldLabel}</span>}
            {newLabel && <span>{newLabel}</span>}
          </div>
        )}
      </div>

      {/* Diff content */}
      <div className="max-h-96 overflow-y-auto font-mono text-sm">
        {diff.lines.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No changes
          </div>
        ) : (
          diff.lines.map((line, i) => (
            <div
              key={i}
              className={`flex border-b border-gray-50 ${
                line.type === 'added'
                  ? 'bg-green-50'
                  : line.type === 'removed'
                  ? 'bg-red-50'
                  : 'bg-white'
              }`}
            >
              {/* Line number */}
              <div className="w-12 shrink-0 text-right pr-2 py-1 text-xs text-gray-400 select-none border-r border-gray-100">
                {line.lineNumber}
              </div>
              {/* Diff indicator */}
              <div className="w-6 shrink-0 text-center py-1 select-none">
                {line.type === 'added' && (
                  <Plus className="h-3 w-3 text-green-500 mx-auto" />
                )}
                {line.type === 'removed' && (
                  <Minus className="h-3 w-3 text-red-500 mx-auto" />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 py-1 px-2 overflow-x-auto">
                <pre className={`whitespace-pre-wrap ${
                  line.type === 'added'
                    ? 'text-green-800'
                    : line.type === 'removed'
                    ? 'text-red-800'
                    : 'text-gray-700'
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
