'use client';

import { useState } from 'react';
import type { GroupedIssue, DiagnosticSeverity } from '@fluid/types';
import { CATEGORY_LABELS } from '@/lib/diagnostics/health-score';
import Link from 'next/link';
import {
  AlertCircle, AlertTriangle, Info, ChevronDown, ChevronRight,
  Wand2, Eye, EyeOff, ExternalLink, CheckCircle2,
  ClipboardCopy, Check, Sparkles,
} from 'lucide-react';

interface HealthIssueGroupsProps {
  groups: GroupedIssue[];
  projectId: string;
  onFixGroup: (group: GroupedIssue) => void;
  onIgnoreGroup: (group: GroupedIssue) => void;
  onPreviewGroup: (group: GroupedIssue) => void;
}

const SEVERITY_CONFIG: Record<DiagnosticSeverity, {
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  border: string;
  bg: string;
  hoverBorder: string;
  dot: string;
  label: string;
}> = {
  error: {
    icon: AlertCircle,
    badge: 'bg-red-500/10 text-red-500 border-red-500/20',
    border: 'border-red-500/20',
    bg: 'bg-red-500/5',
    hoverBorder: 'hover:border-red-500/30',
    dot: 'bg-red-500',
    label: 'Critical Issues',
  },
  warning: {
    icon: AlertTriangle,
    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    hoverBorder: 'hover:border-amber-500/30',
    dot: 'bg-amber-500',
    label: 'Warnings',
  },
  info: {
    icon: Info,
    badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5',
    hoverBorder: 'hover:border-blue-500/30',
    dot: 'bg-blue-500',
    label: 'Suggestions',
  },
};

function IssueGroupCard({
  group,
  projectId,
  onFix,
  onIgnore,
  onPreview,
}: {
  group: GroupedIssue;
  projectId: string;
  onFix: () => void;
  onIgnore: () => void;
  onPreview: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const config = SEVERITY_CONFIG[group.severity];
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} ${config.hoverBorder} transition-all duration-200 overflow-hidden`}>
      {/* Header row */}
      <div
        className="px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-1 h-2 w-2 rounded-full ${config.dot} shrink-0`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-theme-main">{group.title}</span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.badge}`}>
                {group.totalCount} page{group.totalCount !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center rounded-full bg-theme-surface border border-theme-border px-2 py-0.5 text-[10px] text-theme-muted font-medium">
                {CATEGORY_LABELS[group.category] || group.category}
              </span>
              {group.fixableCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                  <Wand2 className="h-2.5 w-2.5" />
                  {group.fixableCount} fixable
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-theme-subtle line-clamp-1">{group.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {group.canFixAll && (
              <button
                onClick={(e) => { e.stopPropagation(); onFix(); }}
                className="inline-flex items-center gap-1 rounded-lg bg-green-500/10 border border-green-500/20 px-2.5 py-1.5 text-[10px] font-semibold text-green-600 hover:bg-green-500/20 transition-all"
                aria-label={`Fix all ${group.title} issues`}
              >
                <Wand2 className="h-2.5 w-2.5" />
                Fix All
              </button>
            )}
            <ChevronDown className={`h-4 w-4 text-theme-muted transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Expanded page list */}
      {expanded && (
        <div className="border-t border-theme-border/50 divide-y divide-theme-border/50">
          {group.affectedPages.map((page) => (
            <div key={page.diagnosticId} className="px-5 py-3 flex items-center gap-3 hover:bg-theme-hover/30 transition-colors">
              <Icon className="h-3 w-3 shrink-0 opacity-60" />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/docs/${projectId}/${page.pageSlug}${page.line ? `?line=${page.line}` : ''}`}
                  className="text-xs font-medium text-theme-main hover:text-theme-accent transition-colors flex items-center gap-1"
                >
                  {page.pageTitle}
                  {page.line && <span className="text-theme-accent font-medium">L{page.line}</span>}
                  <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                </Link>
              </div>
              {page.fixPreview && (
                <span className="text-[9px] font-medium text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                  {page.fixPreview.confidence}
                </span>
              )}
            </div>
          ))}
          {/* Actions */}
          <div className="px-5 py-3 flex items-center gap-2 bg-theme-page/30">
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              className="inline-flex items-center gap-1 rounded-lg border border-theme-border bg-theme-card px-3 py-1.5 text-[10px] font-medium text-theme-main hover:bg-theme-hover transition-all"
            >
              <Eye className="h-2.5 w-2.5" />
              Preview
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onIgnore(); }}
              className="inline-flex items-center gap-1 rounded-lg border border-theme-border bg-theme-card px-3 py-1.5 text-[10px] font-medium text-theme-muted hover:bg-theme-hover transition-all"
            >
              <EyeOff className="h-2.5 w-2.5" />
              Ignore All
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const text = group.affectedPages.map((p) =>
                  `${p.pageTitle}${p.line ? ` (L${p.line})` : ''}`
                ).join('\n');
                navigator.clipboard.writeText(text).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-theme-border bg-theme-card px-3 py-1.5 text-[10px] font-medium text-theme-muted hover:bg-theme-hover transition-all"
            >
              {copied ? <Check className="h-2.5 w-2.5 text-green-500" /> : <ClipboardCopy className="h-2.5 w-2.5" />}
              {copied ? 'Copied!' : 'Copy List'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function HealthIssueGroups({
  groups,
  projectId,
  onFixGroup,
  onIgnoreGroup,
  onPreviewGroup,
}: HealthIssueGroupsProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-theme-main mb-1">All Clear</h3>
        <p className="text-sm text-theme-subtle max-w-sm mx-auto">
          All documentation passes quality checks. No issues to display.
        </p>
      </div>
    );
  }

  // Group by severity
  const errorGroups = groups.filter((g) => g.severity === 'error');
  const warningGroups = groups.filter((g) => g.severity === 'warning');
  const infoGroups = groups.filter((g) => g.severity === 'info');

  return (
    <div className="space-y-6">
      {/* Critical Issues */}
      {errorGroups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-semibold text-red-500">Critical Issues</h3>
            <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
              {errorGroups.reduce((sum, g) => sum + g.totalCount, 0)}
            </span>
          </div>
          <div className="space-y-2">
            {errorGroups.map((group) => (
              <IssueGroupCard
                key={group.rule}
                group={group}
                projectId={projectId}
                onFix={() => onFixGroup(group)}
                onIgnore={() => onIgnoreGroup(group)}
                onPreview={() => onPreviewGroup(group)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warningGroups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-amber-500">Warnings</h3>
            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {warningGroups.reduce((sum, g) => sum + g.totalCount, 0)}
            </span>
          </div>
          <div className="space-y-2">
            {warningGroups.map((group) => (
              <IssueGroupCard
                key={group.rule}
                group={group}
                projectId={projectId}
                onFix={() => onFixGroup(group)}
                onIgnore={() => onIgnoreGroup(group)}
                onPreview={() => onPreviewGroup(group)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info / Suggestions */}
      {infoGroups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-blue-500">Suggestions</h3>
            <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
              {infoGroups.reduce((sum, g) => sum + g.totalCount, 0)}
            </span>
          </div>
          <div className="space-y-2">
            {infoGroups.map((group) => (
              <IssueGroupCard
                key={group.rule}
                group={group}
                projectId={projectId}
                onFix={() => onFixGroup(group)}
                onIgnore={() => onIgnoreGroup(group)}
                onPreview={() => onPreviewGroup(group)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
