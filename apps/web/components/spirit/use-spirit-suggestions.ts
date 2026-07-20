'use client';

import { useEffect, useRef } from 'react';
import { useSpiritStore } from '@fluid/spirit';
import { eventBus } from '@/lib/events';
import { useProjectStore } from '@/lib/stores/project-store';

let suggestionId = 0;

export function useSpiritSuggestions() {
  const addSuggestion = useSpiritStore((s) => s.addSuggestion);
  const prevScoreRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = eventBus.on('health:scanned', (data) => {
      const state = useProjectStore.getState();
      const diagnostics = state.diagnostics;
      if (!diagnostics || diagnostics.length === 0) return;

      // Only suggest if score dropped or is below 80
      if (prevScoreRef.current !== null && data.score >= prevScoreRef.current && data.score >= 80) {
        prevScoreRef.current = data.score;
        return;
      }
      prevScoreRef.current = data.score;

      // Get actionable diagnostics (auto-fixable or high severity)
      const actionable = diagnostics.filter(
        (d) => d.severity === 'error' || d.severity === 'warning' || d.canAutoFix
      );

      if (actionable.length === 0) return;

      // Group by page for cleaner suggestions
      const byPage = new Map<string, typeof actionable>();
      for (const d of actionable) {
        const existing = byPage.get(d.pageId) || [];
        existing.push(d);
        byPage.set(d.pageId, existing);
      }

      // Create suggestions for top issues
      const suggestions = Array.from(byPage.entries()).slice(0, 2);
      for (const [pageId, pageDiags] of suggestions) {
        const errorCount = pageDiags.filter((d) => d.severity === 'error').length;
        const warningCount = pageDiags.filter((d) => d.severity === 'warning').length;
        const fixableCount = pageDiags.filter((d) => d.canAutoFix).length;

        const parts: string[] = [];
        if (errorCount > 0) parts.push(`${errorCount} error${errorCount > 1 ? 's' : ''}`);
        if (warningCount > 0) parts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`);

        const message = `Found ${parts.join(' and ')} on this page${fixableCount > 0 ? ` (${fixableCount} auto-fixable)` : ''}`;

        const pageDiag = pageDiags[0];
        addSuggestion({
          id: `diag-${++suggestionId}`,
          type: errorCount > 0 ? 'warning' : 'info',
          message,
          action: fixableCount > 0
            ? {
                label: 'Review fixes',
                handler: () => {
                  // Open Spirit and suggest reviewing diagnostics
                  const store = useSpiritStore.getState();
                  store.open();
                  setTimeout(() => {
                    const input = document.querySelector<HTMLTextAreaElement>('[data-spirit-input="true"]');
                    if (input) {
                      input.value = `Show me the auto-fixable issues for this page`;
                      input.dispatchEvent(new Event('input', { bubbles: true }));
                      input.focus();
                    }
                  }, 200);
                },
              }
            : undefined,
          dismissible: true,
          createdAt: Date.now(),
        });
      }
    });

    return unsub;
  }, [addSuggestion]);
}
