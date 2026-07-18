'use client';

import { useState, useMemo } from 'react';
import type { Diagnostic } from '@fluid/types';
import { computeDiff } from '@/lib/diff';
import { useAI } from '@/components/ai/use-ai';
import {
  X, Check, Plus, Minus, Equal, Wand2, AlertTriangle, Sparkles, Loader2,
} from 'lucide-react';

interface DiagnosticPreviewProps {
  diagnostic: Diagnostic;
  currentContent: string;
  onApply: (diagnostic: Diagnostic, fixedContent: string) => void;
  onClose: () => void;
}

export function DiagnosticPreview({
  diagnostic,
  currentContent,
  onApply,
  onClose,
}: DiagnosticPreviewProps) {
  const { activeProvider, chat } = useAI();
  const [applying, setApplying] = useState(false);
  const [aiFixing, setAiFixing] = useState(false);
  const [aiFixedContent, setAiFixedContent] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const fixedContent = aiFixedContent ?? diagnostic.fixPreview?.fixedContent ?? currentContent;
  const diff = useMemo(
    () => computeDiff(currentContent, fixedContent),
    [currentContent, fixedContent],
  );

  const hasChanges = diff.added > 0 || diff.removed > 0;

  async function handleApply() {
    setApplying(true);
    try {
      onApply(diagnostic, fixedContent);
    } finally {
      setApplying(false);
    }
  }

  async function handleAIFix() {
    if (!activeProvider) return;
    setAiFixing(true);
    setAiError(null);
    try {
      const data = await chat({
        operation: 'fix',
        content: currentContent,
        selectedText: currentContent,
        pageTitle: diagnostic.pageTitle,
        projectId: undefined,
        diagnostic: {
          title: diagnostic.title,
          description: diagnostic.description,
          rule: diagnostic.rule,
        },
        messages: [{ role: 'user', content: `Fix this documentation issue: ${diagnostic.title}. ${diagnostic.description}\n\nCurrent content:\n${currentContent}` }],
      });

      const fixed = data.fixedContent || data.content || '';
      if (fixed && fixed !== currentContent) {
        setAiFixedContent(fixed);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI fix failed');
    } finally {
      setAiFixing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl mx-4 max-h-[85vh] rounded-2xl border border-theme-border bg-theme-card shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent-light">
              <Wand2 className="h-4 w-4 text-theme-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-theme-main">Fix Preview</h2>
              <p className="text-xs text-theme-muted">{diagnostic.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Confidence Banner */}
        {diagnostic.fixPreview && !aiFixedContent && (
          <div className={`mx-6 mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
            diagnostic.fixPreview.confidence === 'high'
              ? 'bg-green-500/10 text-green-600 border border-green-500/20'
              : diagnostic.fixPreview.confidence === 'medium'
              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
              : 'bg-theme-surface text-theme-muted border border-theme-border'
          }`}>
            {diagnostic.fixPreview.confidence === 'high' ? (
              <Check className="h-3 w-3 shrink-0" />
            ) : (
              <AlertTriangle className="h-3 w-3 shrink-0" />
            )}
            <span>{diagnostic.fixPreview.description}</span>
            <span className="ml-auto font-medium capitalize">{diagnostic.fixPreview.confidence} confidence</span>
          </div>
        )}

        {aiFixedContent && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>AI-generated fix applied — review the diff below</span>
          </div>
        )}

        {/* Diff Stats */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-theme-border text-xs">
          <span className="flex items-center gap-1.5 text-green-600">
            <Plus className="h-3 w-3" />{diff.added} added
          </span>
          <span className="flex items-center gap-1.5 text-red-600">
            <Minus className="h-3 w-3" />{diff.removed} removed
          </span>
          <span className="flex items-center gap-1.5 text-theme-muted">
            <Equal className="h-3 w-3" />{diff.unchanged} unchanged
          </span>
        </div>

        {/* Diff Content */}
        <div className="flex-1 overflow-y-auto font-mono text-sm">
          {diff.lines.length === 0 ? (
            <div className="p-8 text-center text-theme-muted text-sm">No changes detected</div>
          ) : (
            <div>
              {diff.lines.map((line, i) => (
                <div
                  key={i}
                  className={`flex border-b border-theme-border/50 ${
                    line.type === 'added' ? 'bg-green-50 dark:bg-green-950/30' :
                    line.type === 'removed' ? 'bg-red-50 dark:bg-red-950/30' : ''
                  }`}
                >
                  <div className="w-12 shrink-0 text-right pr-2 py-1 text-[11px] text-theme-muted select-none border-r border-theme-border/50">
                    {line.type !== 'added' ? line.lineNumber : ''}
                  </div>
                  <div className="w-12 shrink-0 text-left pl-2 py-1 text-[11px] text-theme-muted select-none border-r border-theme-border/50">
                    {line.type !== 'removed' ? line.lineNumber : ''}
                  </div>
                  <div className="w-6 shrink-0 text-center py-1 select-none">
                    {line.type === 'added' && <Plus className="h-3 w-3 text-green-500 mx-auto" />}
                    {line.type === 'removed' && <Minus className="h-3 w-3 text-red-500 mx-auto" />}
                  </div>
                  <div className="flex-1 py-1 px-3 overflow-x-auto">
                    <pre className={`whitespace-pre-wrap text-[13px] leading-5 ${
                      line.type === 'added' ? 'text-green-800 dark:text-green-300' :
                      line.type === 'removed' ? 'text-red-800 dark:text-red-300' :
                      'text-theme-subtle'
                    }`}>
                      {line.content || ' '}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {aiError && (
          <div className="px-6 py-2 border-t border-theme-border bg-red-500/5 text-xs text-red-500">
            {aiError}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-theme-border bg-theme-page/30">
          <div className="flex items-center gap-2">
            {activeProvider ? (
              <button
                onClick={handleAIFix}
                disabled={aiFixing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-xs font-medium text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-all disabled:opacity-50"
              >
                {aiFixing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 text-theme-accent" />
                )}
                {aiFixing ? 'Fixing with AI...' : 'Fix with AI'}
              </button>
            ) : (
              <a
                href="/dashboard/account/ai"
                className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-xs font-medium text-theme-muted opacity-70 hover:opacity-100 transition-all"
              >
                <Sparkles className="h-3 w-3" />
                Setup AI to fix
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-theme-border bg-theme-card px-4 py-2 text-xs font-medium text-theme-main hover:bg-theme-hover transition-all"
            >
              Cancel
            </button>
            {hasChanges && (
              <button
                onClick={handleApply}
                disabled={applying}
                className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-4 py-2 text-xs font-semibold text-gray-900 hover:bg-theme-accent-hover transition-all disabled:opacity-50"
              >
                <Check className="h-3 w-3" />
                {applying ? 'Applying...' : 'Apply Fix'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
