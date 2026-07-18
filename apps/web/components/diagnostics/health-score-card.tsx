'use client';

import type { HealthScore } from '@fluid/types';
import { getGradeColor } from '@/lib/diagnostics/health-score';
import { CheckCircle, AlertTriangle, Wand2, Sparkles } from 'lucide-react';
import { ScoreRing } from '@/components/score-ring';

interface HealthScoreCardProps {
  healthScore: HealthScore;
}

export function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  return (
    <div className="rounded-xl border border-theme-border bg-theme-card p-5">
      <div className="flex items-center gap-6">
        <ScoreRing
          score={healthScore.score}
          grade={healthScore.grade}
          gradeColor={getGradeColor(healthScore.grade as any)}
        />

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-theme-main">
              Documentation Health
            </h3>
            <p className="text-xs text-theme-muted mt-0.5">
              {healthScore.label}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-red-500">
                {healthScore.errorCount}
              </div>
              <div className="text-[10px] text-theme-muted uppercase tracking-wider">
                Errors
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-500">
                {healthScore.warningCount}
              </div>
              <div className="text-[10px] text-theme-muted uppercase tracking-wider">
                Warnings
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-500">
                {healthScore.infoCount}
              </div>
              <div className="text-[10px] text-theme-muted uppercase tracking-wider">
                Info
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-theme-muted">
            <span className="flex items-center gap-1">
              <Wand2 className="h-3 w-3 text-green-500" />
              {healthScore.fixableCount} auto-fixable
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-theme-accent opacity-50" />
              AI assist (Soon)
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {healthScore.categoryBreakdown.length > 0 && (
        <div className="mt-4 pt-4 border-t border-theme-border">
          <h4 className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider mb-2">
            Issue Breakdown
          </h4>
          <div className="space-y-1.5">
            {healthScore.categoryBreakdown.slice(0, 8).map((cat) => (
              <div
                key={cat.category}
                className="flex items-center gap-2 text-xs"
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    cat.severity === 'error'
                      ? 'bg-red-500'
                      : cat.severity === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                />
                <span className="flex-1 text-theme-subtle">{cat.label}</span>
                <span className="font-medium text-theme-main">{cat.count}</span>
                {cat.fixable > 0 && (
                  <span className="text-green-500 text-[10px]">
                    {cat.fixable} fix
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
