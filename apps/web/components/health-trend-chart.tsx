'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

interface TrendPoint {
  score: number;
  date: string;
}

interface HealthTrendChartProps {
  projectId: string;
  currentScore: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--color-green-500, #22c55e)';
  if (score >= 60) return 'var(--color-amber-500, #f59e0b)';
  return 'var(--color-red-500, #ef4444)';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Critical';
}

export function HealthTrendChart({ projectId, currentScore }: HealthTrendChartProps) {
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrend() {
      try {
        const res = await fetch(`/api/projects/${projectId}/health/reports?limit=20`);
        if (!res.ok) return;
        const data = await res.json();
        const trend: TrendPoint[] = (data.reports ?? [])
          .map((r: { score: number; createdAt: string }) => ({
            score: r.score,
            date: r.createdAt,
          }))
          .reverse();
        // Add current score as the latest point
        trend.push({ score: currentScore, date: new Date().toISOString() });
        setPoints(trend);
      } catch {
        // Silently fail — chart just won't render
      } finally {
        setLoading(false);
      }
    }
    fetchTrend();
  }, [projectId, currentScore]);

  if (loading || points.length < 2) return null;

  const width = 280;
  const height = 80;
  const padding = { top: 8, right: 8, bottom: 16, left: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minScore = Math.max(0, Math.min(...points.map((p) => p.score)) - 5);
  const maxScore = Math.min(100, Math.max(...points.map((p) => p.score)) + 5);
  const range = maxScore - minScore || 1;

  const coords = points.map((p, i) => ({
    x: padding.left + (i / (points.length - 1)) * chartW,
    y: padding.top + chartH - ((p.score - minScore) / range) * chartH,
    score: p.score,
    date: p.date,
  }));

  const pathD = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
    .join(' ');

  const lastCoord = coords[coords.length - 1]!;
  const firstCoord = coords[0]!;
  const areaD = `${pathD} L ${lastCoord.x} ${padding.top + chartH} L ${firstCoord.x} ${padding.top + chartH} Z`;

  const latest = lastCoord;
  const prev = coords.length >= 2 ? coords[coords.length - 2] : null;
  const diff = prev ? latest.score - prev.score : 0;

  const color = getScoreColor(latest.score);

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-theme-main uppercase tracking-wider">Score Trend</h3>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ color, backgroundColor: `${color}15` }}
          >
            {getScoreLabel(latest.score)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {diff > 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
          ) : diff < 0 ? (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          ) : (
            <Minus className="h-3.5 w-3.5 text-theme-muted" />
          )}
          <span className={`font-semibold tabular-nums ${diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-theme-muted'}`}>
            {diff > 0 ? '+' : ''}{diff}
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = padding.top + chartH - ((v - minScore) / range) * chartH;
          if (y < padding.top || y > padding.top + chartH) return null;
          return (
            <line
              key={v}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="currentColor"
              className="text-theme-border"
              strokeDasharray="2 4"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill={color} fillOpacity={0.08} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={i === coords.length - 1 ? 4 : 2.5}
            fill={i === coords.length - 1 ? color : 'var(--color-theme-card, #fff)'}
            stroke={color}
            strokeWidth={i === coords.length - 1 ? 2 : 1.5}
          />
        ))}

        {/* X-axis labels */}
        {coords.length <= 6 && coords.map((c, i) => (
          <text
            key={i}
            x={c.x}
            y={height - 2}
            textAnchor="middle"
            className="fill-theme-muted"
            fontSize={8}
          >
            {new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </text>
        ))}
      </svg>

      <div className="flex items-center justify-between mt-2 text-[10px] text-theme-muted">
        <span className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          Last {points.length} scan{points.length !== 1 ? 's' : ''}
        </span>
        <span>
          Range: {Math.min(...points.map((p) => p.score))}–{Math.max(...points.map((p) => p.score))}
        </span>
      </div>
    </div>
  );
}
