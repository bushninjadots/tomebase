'use client';

import { getScoreRingColor } from '@/lib/diagnostics/health-score';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  grade?: string;
  gradeColor?: string;
  label?: string;
}

export function ScoreRing({
  score,
  size = 120,
  strokeWidth,
  grade,
  gradeColor,
  label,
}: ScoreRingProps) {
  const sw = strokeWidth ?? Math.max(3, Math.round(size / 20));
  const radius = (size - sw * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreRingColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={sw}
          className="text-theme-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gradeColor || color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold text-theme-main ${size >= 100 ? 'text-4xl' : size >= 64 ? 'text-2xl' : 'text-base'}`}>
          {score}
        </span>
        {grade && (
          <span className={`text-xs font-semibold ${gradeColor || 'text-theme-muted'}`}>
            {grade}
          </span>
        )}
        {label && !grade && (
          <span className="text-xs text-theme-muted mt-1">{label}</span>
        )}
      </div>
    </div>
  );
}
