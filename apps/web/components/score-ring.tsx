'use client';

import { useEffect, useState } from 'react';
import { getScoreRingColor } from '@/lib/diagnostics/health-score';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface ScoreRingProps {
  score: number;
  previousScore?: number | null;
  size?: number;
  strokeWidth?: number;
  grade?: string;
  gradeColor?: string;
  label?: string;
  showTrend?: boolean;
  animated?: boolean;
}

export function ScoreRing({
  score,
  previousScore,
  size = 120,
  strokeWidth,
  grade,
  gradeColor,
  label,
  showTrend = false,
  animated = true,
}: ScoreRingProps) {
  const sw = strokeWidth ?? Math.max(3, Math.round(size / 20));
  const radius = (size - sw * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = getScoreRingColor(score);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (animated) {
      const t = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(t);
    }
    setMounted(true);
  }, [animated]);

  const targetOffset = circumference - (score / 100) * circumference;
  const currentOffset = mounted ? targetOffset : circumference;

  const diff = previousScore != null ? score - previousScore : null;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score: ${score} out of 100${grade ? `, Grade ${grade}` : ''}${label ? `. ${label}` : ''}${diff != null ? `. Trend: ${diff === 0 ? 'no change' : diff > 0 ? `up ${diff}` : `down ${Math.abs(diff)}`}` : ''}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={sw}
          className="text-theme-border"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gradeColor || color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={currentOffset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        {/* Glow effect */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gradeColor || color}
          strokeWidth={sw + 4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={currentOffset}
          opacity={0.15}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)', filter: 'blur(4px)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-bold text-theme-main tabular-nums ${size >= 100 ? 'text-4xl' : size >= 64 ? 'text-2xl' : 'text-base'}`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {score}
        </span>
        {grade && (
          <span className={`text-xs font-semibold ${gradeColor || 'text-theme-muted'}`}>
            Grade {grade}
          </span>
        )}
        {label && !grade && (
          <span className="text-[10px] text-theme-muted mt-0.5">{label}</span>
        )}
      </div>
      {showTrend && diff !== null && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          {diff === 0 ? (
            <span className="flex items-center gap-0.5 text-[10px] text-theme-muted">
              <Minus className="h-2.5 w-2.5" /> No change
            </span>
          ) : (
            <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {diff > 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
              {diff > 0 ? '+' : ''}{diff}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
