'use client';

import type { HealthTimelineEntry } from '@fluid/types';
import { formatDistanceToNow } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

interface HealthTimelineProps {
  entries: HealthTimelineEntry[];
  currentScore: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-amber-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

export function HealthTimeline({ entries, currentScore }: HealthTimelineProps) {
  if (entries.length < 2) return null;

  const maxScore = 100;
  const minScore = 0;

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card px-6 py-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-theme-muted" />
        <h3 className="text-xs font-semibold text-theme-main uppercase tracking-wider">Score History</h3>
      </div>

      {/* Mini sparkline chart */}
      <div className="relative h-16 mb-4">
        <svg className="w-full h-full" viewBox={`0 0 ${entries.length * 40} 64`} preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1={0}
              y1={64 - (y / maxScore) * 64}
              x2={entries.length * 40}
              y2={64 - (y / maxScore) * 64}
              className="stroke-theme-border"
              strokeWidth={0.5}
              strokeDasharray="2 4"
            />
          ))}
          {/* Area fill */}
          <path
            d={`M 0 ${64 - (entries[0]!.score / maxScore) * 64} ${entries
              .map((e, i) => `L ${i * 40 + 20} ${64 - (e.score / maxScore) * 64}`)
              .join(' ')} L ${(entries.length - 1) * 40 + 40} 64 L 0 64 Z`}
            className="fill-theme-accent/10"
          />
          {/* Line */}
          <path
            d={`M 0 ${64 - (entries[0]!.score / maxScore) * 64} ${entries
              .map((e, i) => `L ${i * 40 + 20} ${64 - (e.score / maxScore) * 64}`)
              .join(' ')}`}
            className="stroke-theme-accent"
            strokeWidth={2}
            fill="none"
          />
          {/* Data points */}
          {entries.map((e, i) => (
            <circle
              key={e.id}
              cx={i * 40 + 20}
              cy={64 - (e.score / maxScore) * 64}
              r={3}
              className={`fill-theme-accent stroke-theme-card`}
              strokeWidth={1.5}
            />
          ))}
        </svg>
      </div>

      {/* Entry list (last 5) */}
      <div className="space-y-2">
        {entries.slice(-5).reverse().map((entry, i) => {
          const prev = entries[entries.length - 1 - i - 1];
          const diff = prev ? entry.score - prev.score : 0;

          return (
            <div key={entry.id} className="flex items-center gap-3 text-xs">
              <div className={`h-2 w-2 rounded-full ${getScoreColor(entry.score)} shrink-0`} />
              <span className="font-bold tabular-nums w-8" style={{ color: `var(--score-color, inherit)` }}>
                {entry.score}
              </span>
              {diff !== 0 && (
                <span className={`flex items-center gap-0.5 text-[10px] font-medium ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {diff > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {diff > 0 ? '+' : ''}{diff}
                </span>
              )}
              {diff === 0 && i > 0 && (
                <Minus className="h-2.5 w-2.5 text-theme-muted" />
              )}
              <span className="text-theme-muted flex-1">{entry.totalPages} pages</span>
              <span className="text-theme-muted text-[10px]">
                {formatDistanceToNow(new Date(entry.scannedAt), { addSuffix: true })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
