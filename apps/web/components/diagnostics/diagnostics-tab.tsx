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
import { useAI } from '@/components/ai/use-ai';
import {
  Sparkles, Zap, FileText, CheckCircle,
  AlertCircle, AlertTriangle, Info, ArrowRight, Bot,
} from 'lucide-react';
import { Spinner } from '@fluid/ui';

interface DiagnosticsTabProps {
  projectId: string;
  pages: DiagnosticPage[];
  healthScore: HealthScore;
  initialDiagnostics?: Diagnostic[];
}

export function DiagnosticsTab({ projectId, pages, healthScore, initialDiagnostics }: DiagnosticsTabProps) {
  const { activeProvider, chat } = useAI();

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
    if (initialDiagnostics) return initialDiagnostics;
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

  const handleIgnore = useCallback(async (diagnostic: Diagnostic) => {
    // Optimistic update
    setScannedDiagnostics((prev) =>
      prev.map((d) => (d.id === diagnostic.id ? { ...d, ignored: true } : d)),
    );
    // Persist to DB
    try {
      await fetch(`/api/projects/${projectId}/diagnostics/ignore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId: diagnostic.rule, pageId: diagnostic.pageId }),
      });
    } catch {
      // Revert on failure
      setScannedDiagnostics((prev) =>
        prev.map((d) => (d.id === diagnostic.id ? { ...d, ignored: false } : d)),
      );
    }
  }, [projectId]);

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

  const handleIgnoreAll = useCallback(async () => {
    const toIgnore = scannedDiagnostics.filter((d) => {
      if (filter.severity !== 'all' && d.severity !== filter.severity) return false;
      if (filter.category !== 'all' && d.category !== filter.category) return false;
      return true;
    });

    // Optimistic update
    setScannedDiagnostics((prev) =>
      prev.map((d) => {
        if (filter.severity !== 'all' && d.severity !== filter.severity) return d;
        if (filter.category !== 'all' && d.category !== filter.category) return d;
        return { ...d, ignored: true };
      }),
    );

    // Persist each to DB
    for (const d of toIgnore) {
      try {
        await fetch(`/api/projects/${projectId}/diagnostics/ignore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ruleId: d.rule, pageId: d.pageId }),
        });
      } catch {
        // Revert on failure
        setScannedDiagnostics((prev) =>
          prev.map((diag) => (diag.id === d.id ? { ...diag, ignored: false } : diag)),
        );
      }
    }
  }, [scannedDiagnostics, filter, projectId]);

  const handleAIReview = useCallback(async () => {
    if (!activeProvider) return;
    setAiReviewLoading(true);
    setAiReviewResult(null);
    try {
      const topIssues = scannedDiagnostics.slice(0, 10).map((d) => `- [${d.severity}] ${d.title}: ${d.description}`).join('\n');
      const data = await chat({
        operation: 'review',
        content: `Documentation Health Issues:\n${topIssues}`,
        pageTitle: 'Documentation Health Review',
        projectId,
      });
      setAiReviewResult(data.content || data.explanation || 'Review complete');
    } catch (err) {
      setAiReviewResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setAiReviewLoading(false);
    }
  }, [scannedDiagnostics, activeProvider, chat, projectId]);

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
    <div className="space-y-6">
      {/* AI Assistant Banner — only show when no provider configured */}
      {!activeProvider && (
        <div className="rounded-2xl border border-theme-border bg-theme-card p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent-light shrink-0">
            <Bot className="h-5 w-5 text-theme-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-theme-main">AI-Powered Diagnostics</h3>
            <p className="text-xs text-theme-muted mt-0.5">
              Connect an AI provider to explain diagnostics, generate fixes, rewrite content, and more.
            </p>
          </div>
          <a
            href="/dashboard/account/ai"
            className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors shrink-0"
          >
            Setup AI
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* AI Review Result */}
      {aiReviewResult && (
        <div className="rounded-2xl border border-theme-border bg-theme-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-theme-accent" />
              <h3 className="text-sm font-semibold text-theme-main">AI Review</h3>
            </div>
            <button onClick={() => setAiReviewResult(null)} className="p-1.5 rounded-lg text-theme-muted hover:bg-theme-hover transition-colors">
              <span className="text-xs">Dismiss</span>
            </button>
          </div>
          <div className="text-sm text-theme-subtle leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
            {aiReviewResult}
          </div>
        </div>
      )}

      {/* AI Action Result */}
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
          <div className="flex items-center gap-3 rounded-2xl border border-theme-border bg-theme-card px-5 py-4 text-sm text-theme-muted">
            <Spinner size="md" className="text-theme-accent" />
            <span>Applying fixes across all fixable diagnostics...</span>
          </div>
        )}

        {filteredDiagnostics.length === 0 ? (
          <div className="rounded-2xl border border-theme-border bg-theme-card p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-4">
              {scannedDiagnostics.length === 0 ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <Zap className="h-8 w-8 text-green-500" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-theme-main mb-1">
              {scannedDiagnostics.length === 0
                ? 'All clear — no issues found'
                : 'No matching diagnostics'}
            </h3>
            <p className="text-sm text-theme-subtle max-w-sm mx-auto">
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
              projectId={projectId}
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
