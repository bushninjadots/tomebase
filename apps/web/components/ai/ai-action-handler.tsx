'use client';

import { useState } from 'react';
import { Sparkles, Loader2, X, Copy, Check, ArrowRight, Wand2 } from 'lucide-react';
import { useAI } from '@/components/ai/use-ai';

interface AIActionResult {
  content: string;
  description?: string;
  improvedContent?: string;
  fixedContent?: string;
  rewrittenContent?: string;
  explanation?: string;
  summary?: string;
  overallScore?: number;
}

interface AIActionHandlerProps {
  diagnostic?: {
    rule: string;
    title: string;
    description: string;
    pageId?: string;
    pageTitle?: string;
    content?: string;
  };
  action: 'explain' | 'fix' | 'rewrite' | 'improve' | 'review' | 'summarize';
  pageContent?: string;
  pageTitle?: string;
  pageId?: string;
  projectId?: string;
  onComplete?: (result: AIActionResult) => void;
  onApply?: (newContent: string) => void;
}

export function AIActionHandler({
  diagnostic,
  action,
  pageContent,
  pageTitle,
  pageId,
  projectId,
  onComplete,
  onApply,
}: AIActionHandlerProps) {
  const { activeProvider, chat } = useAI();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIActionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAction() {
    if (!activeProvider) return;
    setLoading(true);
    setError(null);

    try {
      const data = await chat({
        operation: action,
        content: pageContent || diagnostic?.content || '',
        selectedText: diagnostic?.content,
        pageTitle: pageTitle || diagnostic?.pageTitle,
        pageId,
        projectId,
        diagnostic: diagnostic
          ? { title: diagnostic.title, description: diagnostic.description, rule: diagnostic.rule }
          : undefined,
      });
      setResult(data);
      onComplete?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const displayContent =
    result?.fixedContent ||
    result?.improvedContent ||
    result?.rewrittenContent ||
    result?.explanation ||
    result?.summary ||
    result?.content ||
    '';

  const actionLabels: Record<string, string> = {
    explain: 'AI Explain',
    fix: 'AI Fix',
    rewrite: 'AI Rewrite',
    improve: 'AI Improve',
    review: 'AI Review',
    summarize: 'AI Summarize',
  };

  if (!activeProvider) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-3 py-1.5 text-xs font-medium text-theme-muted opacity-60 cursor-not-allowed">
        <Sparkles className="h-3 w-3" />
        {actionLabels[action]}
        <span className="text-[10px]">(No AI configured)</span>
      </div>
    );
  }

  if (!result && !loading) {
    return (
      <button
        onClick={runAction}
        className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-3 py-1.5 text-xs font-medium text-theme-muted hover:bg-theme-hover hover:text-theme-main transition-all"
      >
        <Sparkles className="h-3 w-3" />
        {actionLabels[action]}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-theme-border bg-theme-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-theme-hover/30 border-b border-theme-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
          <span className="text-xs font-semibold text-theme-main">{actionLabels[action]}</span>
          {result?.overallScore && (
            <span className="text-[10px] bg-theme-accent/10 text-theme-accent px-1.5 py-0.5 rounded font-medium">
              Score: {result.overallScore}/100
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {displayContent && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(displayContent);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-1 rounded text-theme-muted hover:bg-theme-hover transition-colors"
              title="Copy result"
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
          <button
            onClick={() => setResult(null)}
            className="p-1 rounded text-theme-muted hover:bg-theme-hover transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-64 overflow-y-auto">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-theme-muted">
            <Loader2 className="w-3 h-3 animate-spin" />
            Running {action}...
          </div>
        )}

        {error && (
          <div className="text-xs text-red-500 bg-red-500/5 rounded-lg p-3">
            {error}
          </div>
        )}

        {result && (
          <div className="text-xs text-theme-subtle leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </div>
        )}
      </div>

      {/* Apply button */}
      {result && (result.fixedContent || result.improvedContent || result.rewrittenContent) && onApply && (
        <div className="px-4 py-2 border-t border-theme-border bg-theme-hover/20">
          <button
            onClick={() => onApply(result.fixedContent || result.improvedContent || result.rewrittenContent || '')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-500/20 transition-all"
          >
            <Wand2 className="h-3 w-3" />
            Apply Fix
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
