'use client';

import { useState, useCallback } from 'react';
import type { Diagnostic } from '@fluid/types';
import { useAI } from '@/components/ai/use-ai';
import { Sparkles, Loader2, RefreshCw, X, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface HealthAIInsightsProps {
  projectId: string;
  diagnostics: Diagnostic[];
  healthScore: number;
  aiConfigured: boolean;
  totalPages: number;
}

export function HealthAIInsights({
  projectId,
  diagnostics,
  healthScore,
  aiConfigured,
  totalPages,
}: HealthAIInsightsProps) {
  const { activeProvider, chat } = useAI();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRunAI = aiConfigured && activeProvider;

  const generateInsights = useCallback(async () => {
    if (!canRunAI) return;
    setLoading(true);
    setError(null);
    setInsights(null);

    try {
      const topIssues = diagnostics.slice(0, 15).map(
        (d) => `- [${d.severity}] ${d.title}: ${d.description} (page: "${d.pageTitle}")`,
      ).join('\n');

      const data = await chat({
        operation: 'review',
        content: `Documentation Health Overview:
Health Score: ${healthScore}/100
Total Pages: ${totalPages}
Total Issues: ${diagnostics.length}

Issues:
${topIssues}

Provide a brief analysis of the most critical problems, what's going well, and the top 3 recommended actions. Keep it concise.`,
        pageTitle: 'Health Overview',
        projectId,
      });

      setInsights(data.content || data.explanation || 'Analysis complete.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  }, [canRunAI, diagnostics, healthScore, totalPages, chat, projectId]);

  if (!aiConfigured && !insights && !loading) {
    return (
      <div className="mt-6 rounded-xl border border-theme-border bg-theme-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-theme-muted" />
          <h3 className="text-sm font-semibold text-theme-main">AI Analysis</h3>
        </div>
        <p className="text-xs text-theme-muted">
          Configure an AI provider in{' '}
          <a href="/dashboard/account/ai" className="text-theme-accent hover:underline">your settings</a>{' '}
          to get AI-powered health insights.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-theme-border bg-theme-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className={`h-4 w-4 ${canRunAI ? 'text-theme-accent' : 'text-theme-muted'}`} />
          <h3 className="text-sm font-semibold text-theme-main">AI Analysis</h3>
          {canRunAI && <span className="text-[10px] text-theme-accent bg-theme-accent/10 px-1.5 py-0.5 rounded font-medium">AI</span>}
        </div>
        <div className="flex items-center gap-1">
          {canRunAI && !loading && (
            <button
              onClick={generateInsights}
              className="p-1 rounded text-theme-muted hover:text-theme-accent hover:bg-theme-hover transition-colors"
              title="Refresh insights"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          {insights && (
            <button
              onClick={() => setInsights(null)}
              className="p-1 rounded text-theme-muted hover:text-theme-hover transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {!insights && !loading && canRunAI && (
        <button
          onClick={generateInsights}
          className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-hover px-3 py-2 text-xs font-medium text-theme-main hover:bg-theme-accent/10 hover:border-theme-accent/30 transition-colors"
        >
          <Sparkles className="h-3 w-3 text-theme-accent" />
          Generate AI Analysis
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-theme-muted">
          <Loader2 className="h-3 w-3 animate-spin" />
          Analyzing health data...
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-500 bg-red-500/5 rounded-lg p-3">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {insights && !loading && (
        <div className="text-xs text-theme-subtle leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
          {insights}
        </div>
      )}
    </div>
  );
}
