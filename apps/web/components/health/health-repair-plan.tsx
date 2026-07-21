'use client';

import { useState } from 'react';
import type { AIRepairPlan, GroupedIssue, BatchFixGroup } from '@fluid/types';
import { CATEGORY_LABELS } from '@/lib/diagnostics/health-score';
import {
  Sparkles, Wand2, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Shield, Eye, Loader2,
} from 'lucide-react';

interface HealthRepairPlanProps {
  plan: AIRepairPlan;
  groups: GroupedIssue[];
  onFixSafe: () => void;
  onFixAll: () => void;
  onFixGroup: (group: GroupedIssue) => void;
  fixing: boolean;
}

export function HealthRepairPlan({
  plan,
  groups,
  onFixSafe,
  onFixAll,
  onFixGroup,
  fixing,
}: HealthRepairPlanProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(
    new Set(groups.filter((g) => g.fixableCount > 0).map((g) => g.rule)),
  );

  const fixableGroups = groups.filter((g) => g.fixableCount > 0);
  const safeGroups = fixableGroups.filter((g) => g.classification === 'safe');
  const reviewGroups = fixableGroups.filter((g) => g.classification === 'review');

  if (fixableGroups.length === 0) return null;

  return (
    <div className="rounded-2xl border border-theme-accent/20 bg-theme-accent/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-theme-accent/10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent/10">
            <Sparkles className="h-4 w-4 text-theme-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-theme-main">Fix My Documentation</h3>
            <p className="text-[11px] text-theme-muted">
              {plan.summary.safeFixCount} safe fix{plan.summary.safeFixCount !== 1 ? 'es' : ''} + {plan.summary.reviewFixCount} review needed
              {' · '}Est. +{plan.estimatedScoreImprovement} points
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Safe fixes summary */}
        {safeGroups.length > 0 && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-3.5 w-3.5 text-green-500" />
              <h4 className="text-xs font-semibold text-green-600">Safe to Auto-Fix</h4>
              <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                {plan.summary.safeFixCount} fixes
              </span>
            </div>
            <ul className="space-y-1">
              {safeGroups.map((g) => (
                <li key={g.rule} className="flex items-center gap-2 text-xs text-theme-subtle">
                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                  <span className="flex-1 truncate">{g.title}</span>
                  <span className="text-[10px] text-theme-muted tabular-nums">{g.fixableCount}×</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Review fixes summary */}
        {reviewGroups.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <h4 className="text-xs font-semibold text-amber-600">Review Before Applying</h4>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                {plan.summary.reviewFixCount} fixes
              </span>
            </div>
            <ul className="space-y-1">
              {reviewGroups.map((g) => (
                <li key={g.rule} className="flex items-center gap-2 text-xs text-theme-subtle">
                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="flex-1 truncate">{g.title}</span>
                  <span className="text-[10px] text-theme-muted tabular-nums">{g.fixableCount}×</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap pt-2">
          {safeGroups.length > 0 && (
            <button
              onClick={onFixSafe}
              disabled={fixing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-xs font-semibold text-green-600 hover:bg-green-500/20 transition-all disabled:opacity-50"
            >
              {fixing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              Fix Safe Issues ({plan.summary.safeFixCount})
            </button>
          )}
          <button
            onClick={onFixAll}
            disabled={fixing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-theme-accent/10 border border-theme-accent/20 px-4 py-2.5 text-xs font-semibold text-theme-accent hover:bg-theme-accent/20 transition-all disabled:opacity-50"
          >
            {fixing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Fix All ({fixableGroups.reduce((s, g) => s + g.fixableCount, 0)})
          </button>
        </div>

        {/* Expandable detail */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 inline-flex items-center gap-1 text-[11px] text-theme-muted hover:text-theme-main transition-colors"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? 'Hide' : 'Show'} detailed plan
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {fixableGroups.map((g) => (
              <div
                key={g.rule}
                className="flex items-center gap-3 rounded-xl border border-theme-border bg-theme-card px-4 py-3"
              >
                <input
                  type="checkbox"
                  checked={selectedGroups.has(g.rule)}
                  onChange={(e) => {
                    const next = new Set(selectedGroups);
                    if (e.target.checked) next.add(g.rule);
                    else next.delete(g.rule);
                    setSelectedGroups(next);
                  }}
                  className="rounded border-theme-border"
                  aria-label={`Include ${g.title} in fix`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-theme-main truncate">{g.title}</p>
                  <p className="text-[10px] text-theme-muted">
                    {g.fixableCount} fixable · {CATEGORY_LABELS[g.category]} · {g.classification}
                  </p>
                </div>
                <button
                  onClick={() => onFixGroup(g)}
                  className="text-[10px] text-theme-accent hover:underline"
                >
                  Fix Group
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
