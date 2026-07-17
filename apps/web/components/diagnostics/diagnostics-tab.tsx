'use client';

import { useState, useMemo, useCallback } from 'react';
import type {
  Diagnostic,
  DiagnosticPage,
  DiagnosticFilter,
  HealthScore,
} from '@fluid/types';
import { scanPages, filterDiagnostics } from '@/lib/diagnostics/engine';
import { isFixable, applyFix } from '@/lib/diagnostics/fixes';
import { DiagnosticCard } from '@/components/diagnostics/diagnostic-card';
import { DiagnosticFilters } from '@/components/diagnostics/diagnostic-filters';
import { DiagnosticPreview } from '@/components/diagnostics/diagnostic-preview';
import { BatchActions } from '@/components/diagnostics/batch-actions';
import { AIActionHandler } from '@/components/ai/ai-action-handler';
import {
  Sparkles,
  Zap,
  FileText,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  Check,
  X,
  Bot,
  ArrowRight,
} from 'lucide-react';

interface DiagnosticsTabProps {
  projectId: string;
  pages: DiagnosticPage[];
  healthScore: HealthScore;
}

export function DiagnosticsTab({ projectId, pages, healthScore }: DiagnosticsTabProps) {
  const [filter, setFilter] = useState<DiagnosticFilter>({
    severity: 'all',
    category: 'all',
    pageId: 'all',
    canAutoFix: null,
    search: '',
  });

  const [fixing, setFixing] = useState(false);
  const [previewDiagnostic, setPreviewDiagnostic] = useState<Diagnostic | null>(null);
  const [scannedDiagnostics, setScannedDiagnostics] = useState<Diagnostic[]>(() => {
    const result = scanPages(pages);
    return result.diagnostics;
  });

  // AI state
  const [aiActionDiagnostic, setAiActionDiagnostic] = useState<Diagnostic | null>(null);
  const [aiActionContent, setAiActionContent] = useState('');
  const [aiActionPageTitle, setAiActionPageTitle] = useState('');
  const [aiActionType, setAiActionType] = useState<'explain' | 'fix' | 'rewrite' | 'improve'>('explain');
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState<string | null>(null);

  const filteredDiagnostics = useMemo(
    () => filterDiagnostics(scannedDiagnostics, filter),
    [scannedDiagnostics, filter],
  );

  const errorCount = scannedDiagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = scannedDiagnostics.filter((d) => d.severity === 'warning').length;
  const infoCount = scannedDiagnostics.filter((d) => d.severity === 'info').length;
  const fixableCount = scannedDiagnostics.filter(isFixable).length;

  const persistFix = useCallback(
    async (pageId: string, fixedContent: string) => {
      const res = await fetch(`/api/projects/${projectId}/diagnostics/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, fixedContent }),
      });
      return res.ok;
    },
    [projectId],
  );

  const handlePreview = useCallback((diagnostic: Diagnostic) => {
    setPreviewDiagnostic(diagnostic);
  }, []);

  const handleFix = useCallback(
    (diagnostic: Diagnostic) => {
      if (!isFixable(diagnostic)) return;
      const page = pages.find((p) => p.id === diagnostic.pageId);
      if (!page) return;

      const fixable = diagnostic as import('@/lib/diagnostics/fixes').FixableDiagnostic;
      const result = applyFix(fixable, page.content);
      if (result.success) {
        persistFix(page.id, result.fixedContent);
        page.content = result.fixedContent;
        setScannedDiagnostics((prev) =>
          prev.filter((d) => !result.diagnosticsResolved.includes(d.id)),
        );
      }
    },
    [pages, persistFix],
  );

  const handleIgnore = useCallback((diagnostic: Diagnostic) => {
    setScannedDiagnostics((prev) =>
      prev.map((d) => (d.id === diagnostic.id ? { ...d, ignored: true } : d)),
    );
  }, []);

  const handleAIAction = useCallback((diagnostic: Diagnostic, action: string) => {
    const page = pages.find((p) => p.id === diagnostic.pageId);
    setAiActionDiagnostic(diagnostic);
    setAiActionContent(page?.content || '');
    setAiActionPageTitle(page?.title || diagnostic.pageTitle);
    setAiActionType(action as 'explain' | 'fix' | 'rewrite' | 'improve');
  }, [pages]);

  const handleApplyPreview = useCallback(
    (diagnostic: Diagnostic, fixedContent: string) => {
      const page = pages.find((p) => p.id === diagnostic.pageId);
      if (!page) return;

      persistFix(page.id, fixedContent);
      page.content = fixedContent;
      setScannedDiagnostics((prev) => prev.filter((d) => d.pageId !== page.id));
      setPreviewDiagnostic(null);
    },
    [pages, persistFix],
  );

  const handleFixAll = useCallback(async () => {
    setFixing(true);
    try {
      const safeFixes = scannedDiagnostics.filter(isFixable);
      for (const diagnostic of safeFixes) {
        const page = pages.find((p) => p.id === diagnostic.pageId);
        if (!page) continue;

        const result = applyFix(diagnostic, page.content);
        if (result.success) {
          await persistFix(page.id, result.fixedContent);
          page.content = result.fixedContent;
          setScannedDiagnostics((prev) =>
            prev.filter((d) => !result.diagnosticsResolved.includes(d.id)),
          );
        }
      }
    } finally {
      setFixing(false);
    }
  }, [scannedDiagnostics, pages, persistFix]);

  const handleIgnoreAll = useCallback(() => {
    setScannedDiagnostics((prev) =>
      prev.map((d) => {
        if (filter.severity !== 'all' && d.severity !== filter.severity) return d;
        if (filter.category !== 'all' && d.category !== filter.category) return d;
        return { ...d, ignored: true };
      }),
    );
  }, [filter]);

  const handleAIReview = useCallback(async () => {
    setAiReviewLoading(true);
    setAiReviewResult(null);
    try {
      const topIssues = scannedDiagnostics.slice(0, 10).map((d) => `- [${d.severity}] ${d.title}: ${d.description}`).join('\n');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'review',
          content: `Documentation Health Issues:\n${topIssues}`,
          pageTitle: 'Documentation Health Review',
          projectId,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'AI review failed');
      }
      const data = await response.json();
      setAiReviewResult(data.content || data.explanation || 'Review complete');
    } catch (err) {
      setAiReviewResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setAiReviewLoading(false);
    }
  }, [scannedDiagnostics]);

  const handleExport = useCallback(() => {
    const report = {
      projectId,
      healthScore,
      diagnostics: scannedDiagnostics,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [projectId, healthScore, scannedDiagnostics]);

  return (
    <div className="mt-6 space-y-6">
      {/* AI Banner */}
      <div className="rounded-xl border border-theme-border bg-theme-card p-4 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent-light shrink-0">
          <Sparkles className="h-5 w-5 text-theme-accent" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-theme-main">
            AI Assistant
          </h3>
          <p className="text-xs text-theme-muted mt-0.5">
            Connect an AI provider to unlock: Explain diagnostics, improve readability,
            rewrite documentation, generate missing docs, and more.
          </p>
        </div>
        <a
          href="/dashboard/account/ai"
          className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors shrink-0"
        >
          <Bot className="h-3 w-3" />
          Configure AI
          <ArrowRight className="h-3 w-3" />
        </a>
      </div>

      {/* AI Review Result */}
      {aiReviewResult && (
        <div className="rounded-xl border border-theme-border bg-theme-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-theme-accent" />
              <h3 className="text-sm font-semibold text-theme-main">AI Review</h3>
            </div>
            <button onClick={() => setAiReviewResult(null)} className="p-1 rounded text-theme-muted hover:bg-theme-hover transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-xs text-theme-subtle leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
            {aiReviewResult}
          </div>
        </div>
      )}

      {/* AI Action Result (for individual diagnostic AI actions) */}
      {aiActionDiagnostic && (
        <AIActionHandler
          diagnostic={{
            rule: aiActionDiagnostic.rule,
            title: aiActionDiagnostic.title,
            description: aiActionDiagnostic.description,
            pageId: aiActionDiagnostic.pageId,
            pageTitle: aiActionPageTitle,
            content: aiActionContent,
          }}
          action={aiActionType}
          pageContent={aiActionContent}
          pageTitle={aiActionPageTitle}
          pageId={aiActionDiagnostic.pageId}
          projectId={projectId}
          onComplete={() => {}}
          onApply={(newContent) => {
            const page = pages.find((p) => p.id === aiActionDiagnostic.pageId);
            if (page && newContent) {
              persistFix(page.id, newContent);
              page.content = newContent;
              setScannedDiagnostics((prev) =>
                prev.filter((d) => d.pageId !== page.id),
              );
            }
            setAiActionDiagnostic(null);
          }}
        />
      )}

      {/* Filters */}
      <DiagnosticFilters
        filter={filter}
        onFilterChange={setFilter}
        totalCount={scannedDiagnostics.length}
        filteredCount={filteredDiagnostics.length}
        errorCount={errorCount}
        warningCount={warningCount}
        infoCount={infoCount}
        fixableCount={fixableCount}
      />

      {/* Batch Actions */}
      {filteredDiagnostics.length > 0 && (
        <BatchActions
          diagnostics={filteredDiagnostics}
          onFixAll={handleFixAll}
          onIgnoreAll={handleIgnoreAll}
          onAIReview={handleAIReview}
          onExport={handleExport}
          fixing={fixing}
          aiReviewLoading={aiReviewLoading}
        />
      )}

      {/* Diagnostic List */}
      <div className="space-y-2">
        {fixing && (
          <div className="flex items-center gap-2 rounded-xl border border-theme-border bg-theme-card px-4 py-3 text-xs text-theme-muted">
            <Loader2 className="h-3.5 h-3.5 animate-spin" />
            Applying fixes...
          </div>
        )}

        {filteredDiagnostics.length === 0 ? (
          <div className="rounded-xl border border-theme-border bg-theme-card p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Zap className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-theme-main">
              {scannedDiagnostics.length === 0
                ? 'No issues found'
                : 'No matching diagnostics'}
            </h3>
            <p className="mt-2 text-sm text-theme-subtle max-w-sm mx-auto">
              {scannedDiagnostics.length === 0
                ? 'All documentation passes quality checks. Keep up the great work!'
                : 'Try adjusting your filters to see more results.'}
            </p>
          </div>
        ) : (
          filteredDiagnostics.map((diagnostic) => (
            <DiagnosticCard
              key={diagnostic.id}
              diagnostic={diagnostic}
              onPreview={handlePreview}
              onFix={handleFix}
              onIgnore={handleIgnore}
              onAIAction={handleAIAction}
            />
          ))
        )}
      </div>

      {/* Preview Modal */}
      {previewDiagnostic && (
        <DiagnosticPreview
          diagnostic={previewDiagnostic}
          currentContent={
            pages.find((p) => p.id === previewDiagnostic.pageId)?.content ?? ''
          }
          onApply={handleApplyPreview}
          onClose={() => setPreviewDiagnostic(null)}
        />
      )}
    </div>
  );
}
