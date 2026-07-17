'use client';

import { useState, useMemo, useCallback } from 'react';
import type {
  Diagnostic,
  DiagnosticPage,
  DiagnosticFilter,
  DiagnosticSeverity,
  HealthScore,
} from '@fluid/types';
import { scanPages, filterDiagnostics } from '@/lib/diagnostics/engine';
import { isFixable, applyFix } from '@/lib/diagnostics/fixes';
import { DiagnosticCard } from '@/components/diagnostics/diagnostic-card';
import { DiagnosticFilters } from '@/components/diagnostics/diagnostic-filters';
import { DiagnosticPreview } from '@/components/diagnostics/diagnostic-preview';
import { BatchActions } from '@/components/diagnostics/batch-actions';
import { HealthScoreCard } from '@/components/diagnostics/health-score-card';
import {
  Sparkles,
  Zap,
  FileText,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';

interface DiagnosticsClientProps {
  projectId: string;
  pages: DiagnosticPage[];
  initialHealthScore: HealthScore;
}

export function DiagnosticsClient({
  projectId,
  pages,
  initialHealthScore,
}: DiagnosticsClientProps) {
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

  const filteredDiagnostics = useMemo(
    () => filterDiagnostics(scannedDiagnostics, filter),
    [scannedDiagnostics, filter],
  );

  const errorCount = scannedDiagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = scannedDiagnostics.filter((d) => d.severity === 'warning').length;
  const infoCount = scannedDiagnostics.filter((d) => d.severity === 'info').length;
  const fixableCount = scannedDiagnostics.filter(isFixable).length;

  const handlePreview = useCallback((diagnostic: Diagnostic) => {
    setPreviewDiagnostic(diagnostic);
  }, []);

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

  const handleFix = useCallback(
    (diagnostic: Diagnostic) => {
      if (!isFixable(diagnostic)) return;

      const page = pages.find((p) => p.id === diagnostic.pageId);
      if (!page) return;

      const fixable = diagnostic as import('@/lib/diagnostics/fixes').FixableDiagnostic;
      const result = applyFix(fixable, page.content);
      if (result.success) {
        persistFix(page.id, result.fixedContent);
        setScannedDiagnostics((prev) =>
          prev.filter((d) => !result.diagnosticsResolved.includes(d.id)),
        );
        // Update local page content reference
        page.content = result.fixedContent;
      }
    },
    [pages, persistFix],
  );

  const handleIgnore = useCallback((diagnostic: Diagnostic) => {
    setScannedDiagnostics((prev) =>
      prev.map((d) => (d.id === diagnostic.id ? { ...d, ignored: true } : d)),
    );
  }, []);

  const handleAIAction = useCallback((_diagnostic: Diagnostic, _action: string) => {
    alert('No AI provider configured. Connect an AI provider to enable this feature.');
  }, []);

  const handleApplyPreview = useCallback(
    (diagnostic: Diagnostic, fixedContent: string) => {
      const page = pages.find((p) => p.id === diagnostic.pageId);
      if (!page) return;

      persistFix(page.id, fixedContent);
      setScannedDiagnostics((prev) =>
        prev.filter((d) => d.pageId !== page.id || d.id === diagnostic.id ? true : true),
      );
      // Remove all diagnostics for this page since content changed
      setScannedDiagnostics((prev) =>
        prev.filter((d) => d.pageId !== page.id),
      );
      page.content = fixedContent;
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

  const handleExport = useCallback(() => {
    const report = {
      projectId,
      healthScore: initialHealthScore,
      diagnostics: scannedDiagnostics,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [projectId, initialHealthScore, scannedDiagnostics]);

  return (
    <div className="min-h-screen bg-theme-page">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent-light">
              <Zap className="h-5 w-5 text-theme-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-theme-main tracking-tight">
                Diagnostics & Auto-Fix
              </h1>
              <p className="text-sm text-theme-muted">
                Analyze documentation quality and fix issues automatically
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
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
                onAIReview={() => handleAIAction({} as Diagnostic, 'review')}
                onExport={handleExport}
                fixing={fixing}
              />
            )}

            {/* AI Banner */}
            <div className="rounded-xl border border-theme-border bg-theme-card p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent-light shrink-0">
                <Sparkles className="h-5 w-5 text-theme-accent opacity-50" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-theme-main">
                  AI Assistant
                  <span className="ml-2 inline-flex items-center rounded-full bg-theme-surface border border-theme-border px-2 py-0.5 text-[10px] text-theme-muted font-normal">
                    Coming Soon
                  </span>
                </h3>
                <p className="text-xs text-theme-muted mt-0.5">
                  Connect an AI provider to unlock: Explain diagnostics, improve readability,
                  rewrite documentation, generate missing docs, and more.
                </p>
              </div>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-xs font-medium text-theme-muted opacity-60 cursor-not-allowed shrink-0"
                disabled
              >
                <Sparkles className="h-3 w-3" />
                Connect Provider
              </button>
            </div>

            {/* Diagnostic List */}
            <div className="space-y-2">
              {fixing && (
                <div className="flex items-center gap-2 rounded-xl border border-theme-border bg-theme-card px-4 py-3 text-xs text-theme-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <HealthScoreCard healthScore={initialHealthScore} />

            {/* Quick Stats */}
            <div className="rounded-xl border border-theme-border bg-theme-card p-4">
              <h3 className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider mb-3">
                Scan Summary
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-theme-subtle flex items-center gap-1.5">
                    <FileText className="h-3 w-3" />
                    Pages scanned
                  </span>
                  <span className="font-medium text-theme-main">{pages.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-theme-subtle flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    Errors
                  </span>
                  <span className="font-medium text-red-500">{errorCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-theme-subtle flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Warnings
                  </span>
                  <span className="font-medium text-amber-500">{warningCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-theme-subtle flex items-center gap-1.5">
                    <Info className="h-3 w-3 text-blue-500" />
                    Info
                  </span>
                  <span className="font-medium text-blue-500">{infoCount}</span>
                </div>
              </div>
            </div>

            {/* Rules Reference */}
            <div className="rounded-xl border border-theme-border bg-theme-card p-4">
              <h3 className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider mb-3">
                Active Rules
              </h3>
              <div className="space-y-1.5 text-[11px] text-theme-subtle">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-red-500" />
                  <span>Broken Links</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-red-500" />
                  <span>Empty Pages</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-red-500" />
                  <span>Invalid Markdown</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-red-500" />
                  <span>Broken Images</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-amber-500" />
                  <span>Missing Frontmatter</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-amber-500" />
                  <span>Orphan Pages</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-amber-500" />
                  <span>Stale Documentation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-amber-500" />
                  <span>Heading Hierarchy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-amber-500" />
                  <span>Multiple H1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-blue-500" />
                  <span>Trailing Whitespace</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-blue-500" />
                  <span>Duplicate Blank Lines</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-blue-500" />
                  <span>Large Pages</span>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-theme-muted">
                23 rules active
              </p>
            </div>
          </div>
        </div>
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
