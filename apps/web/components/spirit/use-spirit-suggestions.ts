'use client';

import { useEffect, useRef } from 'react';
import { useSpiritStore } from '@fluid/spirit';
import { eventBus } from '@/lib/events';

let suggestionId = 0;

export function useSpiritSuggestions() {
  const addSuggestion = useSpiritStore((s) => s.addSuggestion);
  const prevScoreRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = eventBus.on('health:scanned', (data) => {
      if (prevScoreRef.current !== null && data.score >= prevScoreRef.current && data.score >= 80) {
        prevScoreRef.current = data.score;
        return;
      }
      prevScoreRef.current = data.score;

      if (data.previousScore !== null && data.score < data.previousScore) {
        addSuggestion({
          id: `score-drop-${++suggestionId}`,
          type: 'warning',
          message: `Health score dropped from ${data.previousScore} to ${data.score}. Review your documentation for issues.`,
          dismissible: true,
          createdAt: Date.now(),
        });
      }
    });

    return unsub;
  }, [addSuggestion]);
}
