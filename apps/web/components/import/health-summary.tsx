'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  AlertTriangle,
  Info,
  Unlink,
  GitBranch,
  FileX,
  Clock,
  Code,
  Heading,
  FileText,
  Copy,
  ListOrdered,
  ArrowRightLeft,
  ALargeSmall,
  BookOpen,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { ScoreRing } from '@/components/score-ring';

interface HealthSummaryProps {
  projectId: string;
}

interface HealthIssue {
  severity: string;
  category: string;
  message: string;
  pageTitle: string;
  pageSlug?: string;
}

interface HealthData {
  score: number;
  totalPages: number;
  issues: HealthIssue[];
  summary: Array<{ category: string; label: string; count: number; severity: string }>;
}

const CHECK_ICONS: Record<string, typeof CheckCircle> = {
  broken_link: Unlink,
  orphan: GitBranch,
  empty: FileX,
  stale: Clock,
  no_headings: Heading,
  no_code_blocks: Code,
  long_paragraph: FileText,
  thin_content: FileText,
  duplicate_title: Copy,
  missing_description: FileText,
  missing_params: ListOrdered,
  missing_returns: ArrowRightLeft,
  naming_inconsistency: ALargeSmall,
  reading_time: BookOpen,
  no_lists: FileText,
  missing_language_tag: Code,
  low_engagement: FileText,
};

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
      <div className="rounded-2xl border border-theme-border bg-theme-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-4 bg-theme-hover rounded animate-pulse" />
          <div className="h-4 w-36 bg-theme-hover rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-theme-hover animate-pulse" />
          <div className="flex-1 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-theme-hover rounded animate-pulse" style={{ width: `${80 - i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!health) return null;

  const issues = health.issues ?? [];
  const summary = health.summary ?? [];
  const summaryMap = new Map(summary.map((s) => [s.category, s]));

  const critical = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const suggestions = issues.filter((i) => i.severity !== 'error' && i.severity !== 'warning');

  const passedChecks = summary.filter((s) => s.count === 0).length;
  const totalChecks = summary.length;

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-theme-border bg-theme-surface/50">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-theme-muted" />
          <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
            Documentation Health
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-theme-muted">
            {health.totalPages} page{health.totalPages === 1 ? '' : 's'} · {passedChecks}/{totalChecks} checks passed
          </span>
          <Link
            href={`/dashboard/${projectId}/health`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Full Report
          </Link>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start gap-6">
          {/* Score Ring */}
          <div className="shrink-0">
            <ScoreRing score={health.score} size={64} />
            <p className="text-center text-[11px] text-theme-muted mt-1">
              {health.score >= 90 ? 'Excellent' : health.score >= 80 ? 'Very Good' : health.score >= 70 ? 'Good' : health.score >= 60 ? 'Fair' : health.score >= 40 ? 'Needs Work' : 'Critical'}
            </p>
          </div>

          {/* Checks Grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
            {summary.map((s) => {
              const Icon = CHECK_ICONS[s.category] ?? CheckCircle;
              const passed = s.count === 0;
              return (
                <div key={s.category} className="flex items-center gap-2 py-1">
                  {passed ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  ) : s.severity === 'error' ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  ) : s.severity === 'warning' ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  )}
                  <span className={`text-xs truncate ${passed ? 'text-theme-muted' : 'text-theme-main font-medium'}`}>
                    {s.label}{!passed ? ` (${s.count})` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grouped Issues */}
        {issues.length > 0 && (
          <div className="mt-5 space-y-3">
            {critical.length > 0 && (
              <IssueGroup title="Critical" severity="error" issues={critical} projectId={projectId} />
            )}
            {warnings.length > 0 && (
              <IssueGroup title="Warnings" severity="warning" issues={warnings} projectId={projectId} />
            )}
            {suggestions.length > 0 && (
              <IssueGroup title="Suggestions" severity="info" issues={suggestions} projectId={projectId} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IssueGroup({
  title,
  severity,
  issues,
  projectId,
}: {
  title: string;
  severity: string;
  issues: HealthIssue[];
  projectId: string;
}) {
  const defaultColors = { border: 'border-blue-500/20', bg: 'bg-blue-500/5', text: 'text-blue-400', icon: Info };
  const colorMap: Record<string, { border: string; bg: string; text: string; icon: typeof AlertTriangle }> = {
    error: { border: 'border-red-500/20', bg: 'bg-red-500/5', text: 'text-red-400', icon: AlertTriangle },
    warning: { border: 'border-amber-500/20', bg: 'bg-amber-500/5', text: 'text-amber-400', icon: AlertTriangle },
    info: defaultColors,
  };

  const colors = colorMap[severity] ?? defaultColors;
  const Icon = colors.icon;

  return (
    <details className="group">
      <summary className={`flex items-center gap-2 cursor-pointer text-sm font-medium ${colors.text} hover:opacity-80 transition-opacity`}>
        <Icon className="h-3.5 w-3.5" />
        <span>{title}</span>
        <span className="text-xs text-theme-muted ml-1">({issues.length})</span>
        <svg className="h-3.5 w-3.5 text-theme-muted ml-auto transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </summary>
      <div className="mt-2 space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
        {issues.slice(0, 15).map((issue, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-theme-subtle py-1.5 px-2 rounded-lg hover:bg-theme-hover/50 transition-colors">
            <Icon className={`h-3 w-3 mt-0.5 shrink-0 ${colors.text}`} />
            <div className="min-w-0">
              <span className="font-medium text-theme-main">{issue.pageTitle}</span>
              <span className="mx-1.5 text-theme-muted/40">—</span>
              <span>{issue.message}</span>
            </div>
          </div>
        ))}
        {issues.length > 15 && (
          <div className="text-xs text-theme-muted pt-1 px-2">
            +{issues.length - 15} more
          </div>
        )}
      </div>
    </details>
  );
}
