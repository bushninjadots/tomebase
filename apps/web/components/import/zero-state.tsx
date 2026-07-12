'use client';

import { AlertTriangle, FileCode, Lightbulb } from 'lucide-react';

interface ZeroStateProps {
  language: string;
  onLoadExample: () => void;
}

const EXPORT_CHECKS = [
  { label: 'exported functions', supported: true },
  { label: 'exported classes', supported: true },
  { label: 'exported interfaces', supported: true },
  { label: 'exported types', supported: true },
  { label: 'exported enums', supported: true },
];

export function ZeroState({ language, onLoadExample }: ZeroStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-[fadeIn_0.3s_ease-out]">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 mb-4">
        <AlertTriangle className="h-7 w-7 text-amber-400" />
      </div>
      <h2 className="text-lg font-bold text-theme-main">No documentation could be generated</h2>
      <p className="mt-1 text-sm text-theme-muted text-center max-w-md">
        We only generate documentation from exported items. Make sure your code exports functions, classes, interfaces, types, or enums with documentation comments.
      </p>

      <div className="mt-6 rounded-xl border border-theme-border bg-theme-card p-4 w-full max-w-sm">
        <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-3">What we look for</h3>
        <div className="space-y-2">
          {EXPORT_CHECKS.map((check) => (
            <div key={check.label} className="flex items-center gap-2 text-sm">
              <span className="text-red-400">✕</span>
              <span className="text-theme-subtle">{check.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 w-full max-w-sm">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-400">Tip</p>
            <p className="text-xs text-theme-muted mt-0.5">
              Adding JSDoc comments to your functions and types will improve the generated documentation quality.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onLoadExample}
          className="inline-flex items-center gap-2 rounded-lg bg-theme-accent text-gray-900 px-4 py-2.5 text-sm font-semibold hover:bg-theme-accent-hover transition-colors"
        >
          <FileCode className="h-4 w-4" />
          Load Example
        </button>
      </div>
    </div>
  );
}
