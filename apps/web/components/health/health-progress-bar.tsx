'use client';

import { useState, useEffect } from 'react';
import type { ScanProgress } from '@fluid/types';
import { Spinner } from '@fluid/ui';
import { formatScanDuration } from '@/lib/diagnostics/ai-fix-engine';
import {
  Activity, Loader2, CheckCircle2,
} from 'lucide-react';

interface HealthProgressBarProps {
  progress: ScanProgress;
}

const PHASE_LABELS: Record<ScanProgress['phase'], string> = {
  idle: 'Ready',
  scanning: 'Scanning pages...',
  analyzing: 'Analyzing issues...',
  complete: 'Scan complete',
  error: 'Scan failed',
};

const PHASE_COLORS: Record<ScanProgress['phase'], string> = {
  idle: 'bg-theme-border',
  scanning: 'bg-theme-accent',
  analyzing: 'bg-blue-500',
  complete: 'bg-green-500',
  error: 'bg-red-500',
};

export function HealthProgressBar({ progress }: HealthProgressBarProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (progress.phase !== 'scanning' && progress.phase !== 'analyzing') return;
    const start = progress.startedAt ? new Date(progress.startedAt).getTime() : Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 100);
    return () => clearInterval(interval);
  }, [progress.phase, progress.startedAt]);

  if (progress.phase === 'idle') return null;

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card px-5 py-4" role="status" aria-live="polite">
      <div className="flex items-center gap-3 mb-3">
        {progress.phase === 'complete' ? (
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        ) : progress.phase === 'error' ? (
          <Activity className="h-4 w-4 text-red-500 shrink-0" />
        ) : (
          <Spinner size="sm" className="text-theme-accent shrink-0" />
        )}
        <span className="text-sm font-medium text-theme-main">
          {PHASE_LABELS[progress.phase]}
        </span>
        {progress.phase !== 'complete' && progress.phase !== 'error' && (
          <span className="text-xs text-theme-muted ml-auto tabular-nums">
            {progress.currentPage}/{progress.totalPages} pages
            {elapsed > 0 && ` · ${formatScanDuration(elapsed)}`}
          </span>
        )}
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-theme-border overflow-hidden" role="progressbar" aria-valuenow={progress.percentComplete} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${PHASE_COLORS[progress.phase]}`}
          style={{ width: `${progress.percentComplete}%` }}
        />
      </div>
      {progress.diagnosticsFound > 0 && progress.phase !== 'complete' && (
        <p className="text-[11px] text-theme-muted mt-2">
          Found {progress.diagnosticsFound} issue{progress.diagnosticsFound !== 1 ? 's' : ''} so far
          {progress.currentRule && ` · ${progress.currentRule}`}
        </p>
      )}
    </div>
  );
}
