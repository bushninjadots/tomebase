'use client';

import { useEffect, useCallback } from 'react';
import { useSpiritStore } from '@fluid/spirit';
import { SpiritBubble } from './spirit-bubble';
import { SpiritDock } from './spirit-dock';
import { SpiritSuggestions } from './spirit-suggestions';
import { SpiritContextActions } from './spirit-context-actions';
import { useSpiritSuggestions } from './use-spirit-suggestions';
import { useLandingSpirit } from './use-landing-spirit';

function useSpiritKeyboard() {
  const toggle = useSpiritStore((s) => s.toggle);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const { preferences } = useSpiritStore.getState();
      const { shortcut } = preferences;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      const matchesCtrl = shortcut.ctrl === ctrl;
      const matchesShift = shortcut.shift === shift;
      const matchesAlt = shortcut.alt === alt;
      const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase();

      if (matchesCtrl && matchesShift && matchesAlt && matchesKey) {
        e.preventDefault();
        e.stopPropagation();
        if (shortcut.action === 'toggle') toggle();
      }

      if (e.key === 'Escape') {
        const { isOpen } = useSpiritStore.getState();
        if (isOpen) {
          e.preventDefault();
          useSpiritStore.getState().close();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        const state = useSpiritStore.getState();
        if (!state.isOpen) state.open();
        setTimeout(() => {
          const input = document.querySelector<HTMLTextAreaElement>('[data-spirit-input="true"]');
          input?.focus();
        }, 100);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);
}

export function Spirit() {
  const mode = useSpiritStore((s) => s.mode);
  const enabled = useSpiritStore((s) => s.preferences.enabled);
  const projectId = useSpiritStore((s) => s.context.projectId);

  useSpiritKeyboard();
  useSpiritSuggestions();
  useLandingSpirit();

  if (!enabled || mode === 'hidden') return null;

  return (
    <>
      {mode === 'floating' && <SpiritBubble projectId={projectId ?? undefined} />}
      {mode === 'docked' && <SpiritDock projectId={projectId ?? undefined} />}
      {mode === 'minimized' && <SpiritBubble projectId={projectId ?? undefined} />}
      <SpiritContextActions />
      <SpiritSuggestions />
    </>
  );
}
