'use client';

import { Check } from 'lucide-react';
import { Spinner } from '@fluid/ui';
import type { ProgressStep } from './use-import-wizard';

interface ImportProgressProps {
  steps: ProgressStep[];
}

export function ImportProgress({ steps }: ImportProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-8 relative">
        <div className="w-16 h-16 rounded-2xl bg-theme-accent/10 flex items-center justify-center">
          <Spinner size="xl" className="text-theme-accent" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-theme-accent/5 animate-pulse" />
      </div>

      <div className="space-y-3 w-full max-w-xs">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 text-sm transition-all duration-300 ${
              step.status === 'active'
                ? 'text-theme-main'
                : step.status === 'done'
                  ? 'text-green-400'
                  : 'text-theme-muted/50'
            }`}
          >
            {step.status === 'done' ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : step.status === 'active' ? (
              <div className="h-4 w-4 rounded-full border-2 border-theme-accent border-t-transparent animate-spin shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-theme-border shrink-0" />
            )}
            <span className={step.status === 'done' ? 'line-through opacity-60' : ''}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-theme-muted">This usually takes a few seconds...</p>
    </div>
  );
}
