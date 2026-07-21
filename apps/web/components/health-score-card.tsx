'use client';

import type { HealthScore, CategoryBreakdown } from '@fluid/types';
import { ScoreRing } from '@/components/score-ring';
import { CATEGORY_LABELS } from '@/lib/diagnostics/health-score';
import { getHealthTailwindColor } from '@/lib/diagnostics/health-score';
import {
  AlertCircle, AlertTriangle, CheckCircle, Info,
  Clock, TrendingUp, TrendingDown, Minus, Activity,
} from 'lucide-react';

interface HealthScoreCardProps {
  healthScore: HealthScore;
  previousScore?: number | null;
  previousScanTime?: Date | null;
  pageCount: number;
}

function SeverityIcon({ severity, className }: { severity: string; className?: string }) {
  switch (severity) {
    case 'error': return <AlertCircle className={className || 'h-3.5 w-3.5 text-red-500'} />;
    case 'warning': return <AlertTriangle className={className || 'h-3.5 w-3.5 text-amber-500'} />;
    default: return <Info className={className || 'h-3.5 w-3.5 text-blue-500'} />;
  }
}

function CategoryRow({ item }: { item: CategoryBreakdown }) {
  const maxCount = 10;
  const width = Math.min(100, (item.count / maxCount) * 100);

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-theme-hover/50 transition-colors">
      <SeverityIcon severity={item.severity} className="h-3 w-3 shrink-0" />
      <span className="text-xs font-medium text-theme-main flex-1 truncate">{item.label}</span>
      <div className="w-20 h-1.5 rounded-full bg-theme-border overflow-hidden shrink-0">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            item.severity === 'error' ? 'bg-red-500' :
            item.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs font-bold text-theme-main w-6 text-right tabular-nums">{item.count}</span>
      {item.fixable > 0 && (
        <span className="text-[9px] font-medium text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full shrink-0">
          {item.fixable} fixable
        </span>
      )}
    </div>
  );
}

export function HealthScoreCard({
  healthScore,
  previousScore,
  previousScanTime,
  pageCount,
}: HealthScoreCardProps) {
  const diff = previousScore != null ? healthScore.score - previousScore : null;

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card overflow-hidden" role="region" aria-label="Health score">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Score Ring Section */}
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
        </div>

        {/* Summary + Categories */}
        <div className="lg:col-span-8 p-6">
          {/* Severity summary */}
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

          {/* Category breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-theme-main uppercase tracking-wider">Category Breakdown</h3>
              <span className="text-[10px] text-theme-muted">
                {healthScore.fixableCount > 0 && `${healthScore.fixableCount} auto-fixable`}
              </span>
            </div>
            {healthScore.categoryBreakdown.length > 0 ? (
              <div className="space-y-0.5 max-h-64 overflow-y-auto">
                {healthScore.categoryBreakdown.map((item) => (
                  <CategoryRow key={item.category} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-center">
                <div>
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-xs text-theme-muted">No issues detected</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
