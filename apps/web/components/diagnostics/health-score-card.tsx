'use client';

import type { HealthScore } from '@fluid/types';
import { getGradeColor } from '@/lib/diagnostics/health-score';
import { CheckCircle, AlertTriangle, Wand2, Sparkles } from 'lucide-react';

interface HealthScoreCardProps {
  healthScore: HealthScore;
}

function ScoreRing({ score, grade, size = 120 }: { score: number; grade: string; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let color = '#22c55e';
  if (score < 60) color = '#ef4444';
  else if (score < 80) color = '#f59e0b';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-theme-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-theme-main">{score}</span>
        <span className={`text-xs font-semibold ${getGradeColor(grade as any)}`}>
          {grade}
        </span>
      </div>
    </div>
  );
}

export function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  return (
    <div className="rounded-xl border border-theme-border bg-theme-card p-5">
      <div className="flex items-center gap-6">
        <ScoreRing score={healthScore.score} grade={healthScore.grade} />

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
