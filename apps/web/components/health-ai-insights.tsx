'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Diagnostic } from '@fluid/types';
import { useAI } from '@/components/ai/use-ai';
import {
  Sparkles, Loader2, RefreshCw, X, AlertCircle,
  TrendingUp, TrendingDown, AlertTriangle, Shield,
  ArrowRight, Lightbulb, CheckCircle2, Target,
} from 'lucide-react';

interface HealthAIInsightsProps {
  projectId: string;
  diagnostics: Diagnostic[];
  healthScore: number;
  totalPages: number;
}

interface ParsedInsights {
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  priorityActions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

function parseInsights(raw: string): ParsedInsights | null {
  if (!raw) return null;

  const sections = {
    executiveSummary: '',
    strengths: [] as string[],
    weaknesses: [] as string[],
    priorityActions: [] as string[],
    riskLevel: 'medium' as ParsedInsights['riskLevel'],
  };

  const lines = raw.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const lower = line.toLowerCase().trim();

    if (lower.includes('executive summary') || lower.includes('overview') || lower.includes('summary')) {
      currentSection = 'summary';
      continue;
    }
    if (lower.includes('strength') || lower.includes('what.s going well') || lower.includes('positive')) {
      currentSection = 'strengths';
      continue;
    }
    if (lower.includes('weakness') || lower.includes('concern') || lower.includes('issue') || lower.includes('problem')) {
      currentSection = 'weaknesses';
      continue;
    }
    if (lower.includes('priority') || lower.includes('recommended') || lower.includes('action') || lower.includes('next step')) {
      currentSection = 'actions';
      continue;
    }
    if (lower.includes('risk') || lower.includes('severity')) {
      if (lower.includes('critical') || lower.includes('severe')) sections.riskLevel = 'critical';
      else if (lower.includes('high')) sections.riskLevel = 'high';
      else if (lower.includes('low') || lower.includes('minimal')) sections.riskLevel = 'low';
      else sections.riskLevel = 'medium';
      continue;
    }

    const cleaned = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
    if (!cleaned) continue;

    switch (currentSection) {
      case 'summary':
        sections.executiveSummary += (sections.executiveSummary ? ' ' : '') + cleaned;
        break;
      case 'strengths':
        sections.strengths.push(cleaned);
        break;
      case 'weaknesses':
        sections.weaknesses.push(cleaned);
        break;
      case 'actions':
        sections.priorityActions.push(cleaned);
        break;
    }
  }

  if (!sections.executiveSummary) {
    sections.executiveSummary = raw.slice(0, 300);
  }

  return sections;
}

const RISK_CONFIG = {
  low: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Low Risk' },
  medium: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Medium Risk' },
  high: { icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'High Risk' },
  critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Critical' },
};

export function HealthAIInsights({
  projectId,
  diagnostics,
  healthScore,
  totalPages,
}: HealthAIInsightsProps) {
  const { activeProvider, chat, loading: contextLoading } = useAI();
  const [loading, setLoading] = useState(false);
  const [rawInsights, setRawInsights] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const canRunAI = !!activeProvider;
  const parsed = useMemo(() => parseInsights(rawInsights || ''), [rawInsights]);

  const generateInsights = useCallback(async () => {
    if (!canRunAI) return;
    setLoading(true);
    setError(null);
    setRawInsights(null);

    try {
      const errors = diagnostics.filter((d) => d.severity === 'error');
      const warnings = diagnostics.filter((d) => d.severity === 'warning');
      const infos = diagnostics.filter((d) => d.severity === 'info');

      const byCategory = diagnostics.reduce((acc, d) => {
        acc[d.category] = (acc[d.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topCategories = Object.entries(byCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([cat, count]) => `  - ${cat}: ${count} issues`)
        .join('\n');

      const topIssues = diagnostics.slice(0, 15).map(
        (d) => `- [${d.severity.toUpperCase()}] ${d.title}: ${d.description} (page: "${d.pageTitle}")`,
      ).join('\n');

      const data = await chat({
        operation: 'review',
        content: `You are a senior documentation architect analyzing a project's documentation health. Provide a thorough, actionable analysis.

## Health Metrics
- Health Score: ${healthScore}/100
- Total Pages: ${totalPages}
- Total Issues: ${diagnostics.length}
- Errors: ${errors.length} | Warnings: ${warnings.length} | Info: ${infos.length}

## Issues by Category
${topCategories || 'No issues detected.'}

## Top Issues
${topIssues || 'No issues detected.'}

## Analysis Required

Provide your analysis in this EXACT format:

Executive Summary:
[2-3 sentences: overall documentation quality, most critical concern, and top recommendation]

Strengths:
- [specific strength backed by data, e.g. "Good link integrity with only 2 broken links across 50 pages"]
- [another strength]
- [aim for 2-4 strengths]

Weaknesses:
- [specific weakness with impact assessment, e.g. "35% of pages missing frontmatter - hurts SEO and discoverability"]
- [another weakness]
- [aim for 2-4 weaknesses]

Priority Actions:
- [Most impactful fix: what to do, why it matters, estimated effort]
- [Second priority with same detail]
- [Third priority]
- [aim for 3-5 actions, ordered by impact]

Risk Level: [low/medium/high/critical]
[One sentence justifying the risk level]`,
        pageTitle: 'Documentation Health Analysis',
        projectId,
      });

      const content = data.content || data.explanation || '';
      setRawInsights(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  }, [canRunAI, diagnostics, healthScore, totalPages, chat, projectId]);

  if (contextLoading) {
    return (
      <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent-light">
            <Loader2 className="h-5 w-5 text-theme-accent animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-theme-main">AI Analysis</h3>
            <p className="text-xs text-theme-muted">Connecting to AI provider...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canRunAI && !rawInsights && !loading) {
    return (
      <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent-light shrink-0">
            <Sparkles className="h-5 w-5 text-theme-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-theme-main mb-1">AI Health Analysis</h3>
            <p className="text-xs text-theme-muted mb-3">
              Connect an AI provider to get intelligent insights about your documentation health,
              prioritized improvement actions, and automated quality assessments.
            </p>
            <a
              href="/dashboard/account/ai"
              className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors"
            >
              Configure AI Provider
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent-light">
            <Sparkles className="h-4 w-4 text-theme-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-theme-main">AI Health Analysis</h3>
            <p className="text-[11px] text-theme-muted">
              {activeProvider?.provider} • {activeProvider?.model || 'default model'}
            </p>
          </div>
          {parsed && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${RISK_CONFIG[parsed.riskLevel].bg} ${RISK_CONFIG[parsed.riskLevel].color} ${RISK_CONFIG[parsed.riskLevel].border}`}>
              {(() => { const R = RISK_CONFIG[parsed.riskLevel]; const I = R.icon; return <I className="h-2.5 w-2.5" />; })()}
              {RISK_CONFIG[parsed.riskLevel].label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {canRunAI && !loading && (
            <button
              onClick={generateInsights}
              className="p-2 rounded-lg text-theme-muted hover:text-theme-accent hover:bg-theme-hover transition-colors"
              title="Refresh analysis"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          {rawInsights && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-colors text-xs"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-5">
        {!rawInsights && !loading && (
          <button
            onClick={generateInsights}
            className="inline-flex items-center gap-2 rounded-xl border border-theme-border bg-theme-hover px-4 py-3 text-sm font-medium text-theme-main hover:bg-theme-accent/10 hover:border-theme-accent/30 transition-all"
          >
            <Sparkles className="h-4 w-4 text-theme-accent" />
            Generate AI Analysis
            <ArrowRight className="h-3 w-3 text-theme-muted" />
          </button>
        )}

        {loading && (
          <div className="flex items-center gap-3 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent-light">
              <Loader2 className="h-4 w-4 text-theme-accent animate-spin" />
            </div>
            <div>
              <p className="text-sm font-medium text-theme-main">Analyzing documentation health...</p>
              <p className="text-xs text-theme-muted">Reviewing {diagnostics.length} issues across {totalPages} pages</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-500">Analysis Failed</p>
              <p className="text-xs text-theme-muted mt-1">{error}</p>
            </div>
          </div>
        )}

        {parsed && expanded && !loading && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-3.5 w-3.5 text-theme-accent" />
                <h4 className="text-xs font-semibold text-theme-main uppercase tracking-wider">Executive Summary</h4>
              </div>
              <p className="text-sm text-theme-subtle leading-relaxed">{parsed.executiveSummary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parsed.strengths.length > 0 && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                    <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider">Strengths</h4>
                  </div>
                  <ul className="space-y-2">
                    {parsed.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-theme-subtle">
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsed.weaknesses.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                    <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Weaknesses</h4>
                  </div>
                  <ul className="space-y-2">
                    {parsed.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-theme-subtle">
                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {parsed.priorityActions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-3.5 w-3.5 text-theme-accent" />
                  <h4 className="text-xs font-semibold text-theme-main uppercase tracking-wider">Priority Actions</h4>
                </div>
                <div className="space-y-2">
                  {parsed.priorityActions.map((action, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-theme-border bg-theme-hover/50 px-4 py-3"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-theme-accent/10 text-[10px] font-bold text-theme-accent shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-xs text-theme-subtle leading-relaxed">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-theme-border">
              <p className="text-[11px] text-theme-muted flex items-center gap-1.5">
                <Lightbulb className="h-3 w-3" />
                Ask Tome Spirit for help implementing any of these actions
              </p>
            </div>
          </div>
        )}

        {rawInsights && !parsed && !loading && (
          <div className="text-sm text-theme-subtle leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
            {rawInsights}
          </div>
        )}
      </div>
    </div>
  );
}
