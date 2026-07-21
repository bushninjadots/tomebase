'use client';

import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useSpiritStore } from '@fluid/spirit';
import type { ViewMode } from '../editor-types';

interface UseKeyboardShortcutsOptions {
  handleSave: () => void;
  viewMode: ViewMode;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
  zenMode: boolean;
  setZenMode: Dispatch<SetStateAction<boolean>>;
  typewriterMode: boolean;
  setTypewriterMode: Dispatch<SetStateAction<boolean>>;
}

export function useKeyboardShortcuts({
  handleSave,
  setViewMode,
  setZenMode,
  setTypewriterMode,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === 's') { e.preventDefault(); handleSave(); }
      if (isMeta && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setViewMode((v) => v === 'edit' ? 'preview' : v === 'preview' ? 'split' : 'edit');
      }
      if (isMeta && e.key === '\\') {
        e.preventDefault();
        setZenMode((v) => !v);
      }
      if (isMeta && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setTypewriterMode((v) => !v);
      }
      if (isMeta && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        useSpiritStore.getState().toggle();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, setViewMode, setZenMode, setTypewriterMode]);
}
