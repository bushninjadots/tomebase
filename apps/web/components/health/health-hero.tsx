'use client';

import type { HealthScore } from '@fluid/types';
import { ScoreRing } from '@/components/score-ring';
import { getHealthTailwindColor } from '@/lib/diagnostics/health-score';
import {
  CheckCircle, AlertTriangle, Zap, Wand2, FileText,
  Clock, TrendingUp, TrendingDown, Minus, Sparkles,
  Loader2, Activity,
} from 'lucide-react';

interface HealthHeroProps {
  healthScore: HealthScore;
  previousScore: number | null;
  previousScanTime: Date | null;
  totalPages: number;
  onScan: () => void;
  onFixAll: () => void;
  scanning: boolean;
  fixing: boolean;
}

export function HealthHero({
  healthScore,
  previousScore,
  previousScanTime,
  totalPages,
  onScan,
  onFixAll,
  scanning,
  fixing,
}: HealthHeroProps) {
  const diff = previousScore != null ? healthScore.score - previousScore : null;
  const hasFixable = healthScore.fixableCount > 0;

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Score Ring */}
        <div className="lg:col-span-4 p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-theme-border bg-theme-page/30">
          <ScoreRing
            score={healthScore.score}
            previousScore={previousScore}
            size={160}
            grade={healthScore.grade}
            label="Documentation Health"
            showTrend
          />
          <div className="mt-4 text-center">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getHealthTailwindColor(healthScore.score)}`}>
              {healthScore.score >= 80 ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              {healthScore.label}
            </span>
          </div>
          {previousScanTime && (
            <p className="text-[10px] text-theme-muted mt-2 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              Last scan: {new Date(previousScanTime).toLocaleDateString()}
            </p>
          )}
          {diff != null && diff !== 0 && (
            <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {diff > 0 ? '+' : ''}{diff} from last scan
            </p>
          )}
        </div>

        {/* Stats + Actions */}
        <div className="lg:col-span-8 p-6">
          {/* Severity stats */}
          <div className="grid grid-cols-3 gap-3 mb-5" role="group" aria-label="Issue severity summary">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
              <div className="text-2xl font-bold text-red-500 tabular-nums">{healthScore.errorCount}</div>
              <div className="text-[10px] font-medium text-red-500/70 uppercase tracking-wider">Errors</div>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
              <div className="text-2xl font-bold text-amber-500 tabular-nums">{healthScore.warningCount}</div>
              <div className="text-[10px] font-medium text-amber-500/70 uppercase tracking-wider">Warnings</div>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
              <div className="text-2xl font-bold text-blue-500 tabular-nums">{healthScore.infoCount}</div>
              <div className="text-[10px] font-medium text-blue-500/70 uppercase tracking-wider">Info</div>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="flex items-center gap-4 mb-5 text-xs text-theme-muted">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {totalPages} pages
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-green-500" />
              {healthScore.fixableCount} auto-fixable
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onScan}
              disabled={scanning}
              className="inline-flex items-center gap-1.5 rounded-xl border border-theme-border bg-theme-card px-4 py-2.5 text-xs font-medium text-theme-main hover:bg-theme-hover hover:border-theme-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Run health scan"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Activity className="h-3 w-3" />
                  Scan Again
                </>
              )}
            </button>

            {hasFixable && (
              <button
                onClick={onFixAll}
                disabled={fixing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-xs font-semibold text-green-600 hover:bg-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Fix all auto-fixable issues"
              >
                {fixing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3 w-3" />
                    Fix All ({healthScore.fixableCount})
                  </>
                )}
              </button>
            )}

            {hasFixable && (
              <button
                onClick={onFixAll}
                disabled={fixing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-theme-accent/10 border border-theme-accent/20 px-4 py-2.5 text-xs font-semibold text-theme-accent hover:bg-theme-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Fix my documentation with AI"
              >
                <Sparkles className="h-3 w-3" />
                Fix My Documentation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
