'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, X, Copy, Check, ArrowRight, Wand2 } from 'lucide-react';
import { useAI } from '@/components/ai/use-ai';

interface InlineAIResultProps {
  action: 'improve' | 'rewrite';
  pageContent: string;
  selectedText?: string;
  pageTitle?: string;
  pageId?: string;
  projectId?: string;
  onAccept: (newContent: string) => void;
  onDismiss: () => void;
}

export function InlineAIResult({
  action,
  pageContent,
  selectedText,
  pageTitle,
  pageId,
  projectId,
  onAccept,
  onDismiss,
}: InlineAIResultProps) {
  const { activeProvider, chat } = useAI();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Run the AI action on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await chat({
          operation: action,
          content: selectedText || pageContent,
          pageTitle: pageTitle || undefined,
          pageId: pageId || undefined,
          projectId: projectId || undefined,
          messages: [{ role: 'user', content: `${action === 'improve' ? 'Improve' : 'Rewrite'} this documentation${selectedText ? ' (selected text)' : ''}:` }],
        });
        if (!cancelled) {
          const newContent = response.improvedContent || response.rewrittenContent || response.content || '';
          setResult(newContent);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'AI request failed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCopy() {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="my-2 rounded-lg border border-theme-accent/30 bg-theme-accent/5 p-3 flex items-center gap-2 text-sm text-theme-subtle animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin text-theme-accent" />
        <span>AI is {action === 'improve' ? 'improving' : 'rewriting'} your content...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-2 rounded-lg border border-theme-danger/30 bg-theme-danger/5 p-3 flex items-center justify-between text-sm">
        <span className="text-theme-danger">{error}</span>
        <button onClick={onDismiss} className="text-theme-muted hover:text-theme-subtle">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="my-2 rounded-lg border border-theme-accent/30 bg-theme-accent/5 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-theme-accent/20 bg-theme-accent/10">
        <div className="flex items-center gap-2 text-sm font-medium text-theme-accent">
          <Sparkles className="w-4 h-4" />
          AI {action === 'improve' ? 'Improvement' : 'Rewrite'}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-theme-hover text-theme-muted hover:text-theme-subtle transition-colors"
            title="Copy"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-theme-success" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-theme-hover text-theme-muted hover:text-theme-subtle transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="p-3 max-h-64 overflow-y-auto">
        <pre className="text-sm text-theme-main whitespace-pre-wrap font-sans leading-relaxed">{result}</pre>
      </div>
      <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-theme-accent/20">
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 text-xs font-medium text-theme-muted hover:text-theme-subtle rounded-md hover:bg-theme-hover transition-colors"
        >
          Dismiss
        </button>
        <button
          onClick={() => onAccept(result)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-theme-accent rounded-md hover:bg-theme-accent/90 transition-colors"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Apply
        </button>
      </div>
    </div>
  );
}
