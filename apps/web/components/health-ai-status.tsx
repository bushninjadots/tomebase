'use client';

import { useAI } from '@/components/ai/use-ai';
import { CheckCircle2, AlertCircle, Loader2, Bot, Zap, Cpu } from 'lucide-react';

export function HealthAIStatus() {
  const { activeProvider, loading: contextLoading } = useAI();

  if (contextLoading) {
    return (
      <div className="rounded-2xl border border-theme-border bg-theme-card p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 text-theme-accent animate-spin" />
          <span className="text-xs text-theme-muted">Checking AI connection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${activeProvider ? 'bg-green-500/10' : 'bg-theme-hover'}`}>
            {activeProvider ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Bot className="h-4 w-4 text-theme-muted" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-theme-main">AI Assistant</h4>
            {activeProvider ? (
              <p className="text-[11px] text-theme-muted flex items-center gap-1">
                <Zap className="h-2.5 w-2.5 text-green-500" />
                {activeProvider.provider} • {activeProvider.model || 'default model'}
              </p>
            ) : (
              <p className="text-[11px] text-theme-muted">Not configured</p>
            )}
          </div>
        </div>
        {!activeProvider && (
          <a
            href="/dashboard/account/ai"
            className="inline-flex items-center gap-1 rounded-lg bg-theme-accent px-2.5 py-1.5 text-[10px] font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors"
          >
            <Cpu className="h-2.5 w-2.5" />
            Setup
          </a>
        )}
      </div>
    </div>
  );
}
