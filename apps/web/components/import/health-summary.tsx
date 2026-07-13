'use client';

import { CheckCircle, AlertTriangle, Info, Unlink, GitBranch, FileX, Clock, Eye, Code, Heading, FileText, Copy, ListOrdered, ArrowRightLeft, ALargeSmall, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HealthSummaryProps {
  projectId: string;
}

interface HealthData {
  score: number;
  totalPages: number;
  issues: Array<{ severity: string; category: string; message: string; pageTitle: string }>;
  summary: Array<{ category: string; label: string; count: number; severity: string }>;
}

const CHECKS: Record<string, { label: string; icon: typeof CheckCircle }> = {
  broken_link:          { label: 'No broken wiki links',        icon: Unlink },
  orphan:               { label: 'No orphan pages',             icon: GitBranch },
  empty:                { label: 'No empty pages',              icon: FileX },
  stale:                { label: 'Pages up to date',            icon: Clock },
  low_engagement:       { label: 'Good engagement',             icon: Eye },
  no_headings:          { label: 'Pages have headings',         icon: Heading },
  no_code_blocks:       { label: 'Code examples present',       icon: Code },
  missing_language_tag: { label: 'Code blocks tagged',          icon: Code },
  long_paragraph:       { label: 'Paragraphs are readable',     icon: FileText },
  no_lists:             { label: 'Lists used for readability',  icon: FileText },
  thin_content:         { label: 'Content is substantial',      icon: FileText },
  reading_time:         { label: 'Reading time estimated',      icon: BookOpen },
  duplicate_title:      { label: 'No duplicate titles',         icon: Copy },
  missing_description:  { label: 'Pages have descriptions',     icon: FileText },
  missing_params:       { label: 'Parameters documented',       icon: ListOrdered },
  missing_returns:      { label: 'Return values documented',    icon: ArrowRightLeft },
  naming_inconsistency: { label: 'Consistent naming',           icon: ALargeSmall },
};

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';
  const label = score >= 90 ? 'Excellent' : score >= 80 ? 'Very Good' : score >= 70 ? 'Good' : score >= 60 ? 'Fair' : score >= 40 ? 'Needs Work' : 'Critical';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-theme-border" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="text-center -mt-[72px] mb-6">
        <div className="text-lg font-bold text-theme-main">{score}</div>
        <div className="text-[10px] text-theme-muted">{label}</div>
      </div>
    </div>
  );
}

export function HealthSummary({ projectId }: HealthSummaryProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/health`)
      .then((res) => res.json())
      .then((data) => {
        if (data.score !== undefined) setHealth(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-theme-border bg-theme-card p-5 animate-pulse">
        <div className="h-4 w-32 bg-theme-hover rounded mb-4" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 bg-theme-hover rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!health) return null;

  const issues = health.issues ?? [];
  const summary = health.summary ?? [];
  const summaryMap = new Map(summary.map((s) => [s.category, s]));

  return (
    <div className="rounded-xl border border-theme-border bg-theme-card p-5">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
          Documentation Health
        </h3>
        <span className="text-xs text-theme-muted">
          {health.totalPages} page{health.totalPages === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex items-start gap-5 mb-5">
        <ScoreRing score={health.score} />
        <div className="flex-1 space-y-1.5 pt-2">
          {Object.entries(CHECKS).map(([key, { label, icon: Icon }]) => {
            const s = summaryMap.get(key);
            const count = s?.count ?? 0;
            const severity = s?.severity ?? 'info';
            const passed = count === 0;
            return (
              <div key={key} className="flex items-center gap-2 text-sm">
                {passed ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" />
                ) : severity === 'error' ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                ) : severity === 'warning' ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                ) : (
                  <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                )}
                <span className={passed ? 'text-theme-subtle' : 'text-theme-main font-medium'}>
                  {label}{!passed ? ` (${count})` : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {issues.length > 0 && (
        <details className="group">
          <summary className="text-xs font-medium text-theme-muted cursor-pointer hover:text-theme-subtle transition-colors">
            {issues.length} issue{issues.length === 1 ? '' : 's'} found — click to expand
          </summary>
          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
            {issues.slice(0, 20).map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-theme-subtle py-1 border-t border-theme-border first:border-0">
                {issue.severity === 'error' ? (
                  <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                ) : issue.severity === 'warning' ? (
                  <AlertTriangle className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                ) : (
                  <Info className="h-3 w-3 text-blue-400 mt-0.5 shrink-0" />
                )}
                <span>
                  <span className="font-medium text-theme-main">{issue.pageTitle}</span>
                  {' — '}
                  {issue.message}
                </span>
              </div>
            ))}
            {issues.length > 20 && (
              <div className="text-xs text-theme-muted pt-1">
                +{issues.length - 20} more
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
