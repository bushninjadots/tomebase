'use client';

import type { Diagnostic } from '@fluid/types';
import { isFixable } from '@/lib/diagnostics/fixes';
import {
  Wand2,
  Sparkles,
  Download,
  EyeOff,
  Loader2,
} from 'lucide-react';

interface BatchActionsProps {
  diagnostics: Diagnostic[];
  onFixAll: () => void;
  onIgnoreAll: () => void;
  onAIReview: () => void;
  onExport: () => void;
  fixing: boolean;
}

export function BatchActions({
  diagnostics,
  onFixAll,
  onIgnoreAll,
  onAIReview,
  onExport,
  fixing,
}: BatchActionsProps) {
  const fixableCount = diagnostics.filter(isFixable).length;
  const hasFixable = fixableCount > 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {hasFixable && (
        <button
          onClick={onFixAll}
          disabled={fixing}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs font-medium text-green-600 hover:bg-green-500/20 transition-all disabled:opacity-50"
        >
          {fixing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Wand2 className="h-3 w-3" />
          )}
          Fix All Safe ({fixableCount})
        </button>
      )}

      <button
        onClick={onAIReview}
        className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-xs font-medium text-theme-muted opacity-60 cursor-not-allowed"
        disabled
        title="No AI provider configured"
      >
        <Sparkles className="h-3 w-3" />
        AI Review (Soon)
      </button>

      <button
        onClick={onIgnoreAll}
        className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-xs font-medium text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-all"
      >
        <EyeOff className="h-3 w-3" />
        Ignore All
      </button>

      <button
        onClick={onExport}
        className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-xs font-medium text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-all"
      >
        <Download className="h-3 w-3" />
        Export Report
      </button>
    </div>
  );
}
