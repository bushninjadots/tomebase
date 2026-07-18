'use client';

import { useSpiritStore } from '@fluid/spirit';

export function useSpirit() {
  const store = useSpiritStore();

  return {
    // State
    isOpen: store.isOpen,
    mode: store.mode,
    aiState: store.aiState,
    isPinned: store.isPinned,
    context: store.context,
    preferences: store.preferences,

    // Quick actions
    toggle: store.toggle,
    open: store.open,
    close: store.close,
    pin: store.pin,
    unpin: store.unpin,

    // Preferences
    updatePreferences: store.updatePreferences,

    // Context
    setContext: store.setContext,
  };
}
