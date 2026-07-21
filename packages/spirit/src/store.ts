import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  SpiritStore,
  SpiritConversation,
} from './types';
import {
  DEFAULT_POSITION,
  DEFAULT_PREFERENCES,
  DEFAULT_CONTEXT,
} from './types';

let idCounter = 0;
function generateId(): string {
  idCounter++;
  return `spirit-${Date.now()}-${idCounter}`;
}

export const useSpiritStore = create<SpiritStore>()(
  persist(
    (set, get) => ({
      mode: 'floating',
      aiState: 'idle',
      isOpen: false,
      isPinned: false,
      position: { ...DEFAULT_POSITION },
      conversations: [],
      activeConversationId: null,
      suggestions: [],
      landingComment: null,
      context: { ...DEFAULT_CONTEXT },
      preferences: { ...DEFAULT_PREFERENCES },
      movement: {
        velocity: { x: 0, y: 0 },
        target: null,
        isWandering: false,
        wanderTimer: null,
        lastActivity: Date.now(),
        breathPhase: 0,
      },
      speechBubbles: [],
      isFirstVisit: !localStorage.getItem('tome-spirit-seen'),
      lastMousePosition: { x: 0, y: 0 },
      isMouseMoving: false,

      setMode: (mode) => set({ mode }),

      toggle: () => {
        const { isOpen, mode } = get();
        if (mode === 'hidden') return;
        set({ isOpen: !isOpen });
      },

      open: () => {
        const { mode } = get();
        if (mode === 'hidden') return;
        set({ isOpen: true });
      },

      close: () => set({ isOpen: false }),

      pin: () => set({ isPinned: true, mode: 'docked', isOpen: true }),

      unpin: () => set({ isPinned: false, mode: 'floating', isOpen: false }),

      setAIState: (aiState) => set({ aiState }),

      setPosition: (position) => set({ position }),

      setContext: (ctx) =>
        set((state) => ({ context: { ...state.context, ...ctx } })),

      addMessage: (message) =>
        set((state) => {
          const convId = state.activeConversationId;
          if (!convId) return state;
          return {
            conversations: state.conversations.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: [...c.messages, message],
                    updatedAt: Date.now(),
                  }
                : c,
            ),
          };
        }),

      updateLastMessage: (content) =>
        set((state) => {
          const convId = state.activeConversationId;
          if (!convId) return state;
          return {
            conversations: state.conversations.map((c) =>
              c.id === convId && c.messages.length > 0
                ? {
                    ...c,
                    messages: c.messages.map((m, i) =>
                      i === c.messages.length - 1 ? { ...m, content } : m,
                    ),
                    updatedAt: Date.now(),
                  }
                : c,
            ),
          };
        }),

      setActiveConversation: (id) => set({ activeConversationId: id }),

      createConversation: () => {
        const id = generateId();
        const conversation: SpiritConversation = {
          id,
          title: 'New conversation',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      addSuggestion: (suggestion) =>
        set((state) => ({
          suggestions: [...state.suggestions.slice(-4), suggestion],
        })),

      dismissSuggestion: (id) =>
        set((state) => ({
          suggestions: state.suggestions.filter((s) => s.id !== id),
        })),

      setLandingComment: (text) =>
        set({ landingComment: { id: generateId(), text } }),

      clearLandingComment: () => set({ landingComment: null }),

      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      resetPosition: () => set({ position: { ...DEFAULT_POSITION } }),

      setMovement: (movement) =>
        set((state) => ({ movement: { ...state.movement, ...movement } })),

      setTarget: (target) =>
        set((state) => ({ movement: { ...state.movement, target } })),

      setWandering: (wandering) =>
        set((state) => ({ movement: { ...state.movement, isWandering: wandering } })),

      setLastActivity: (time) =>
        set((state) => ({ movement: { ...state.movement, lastActivity: time } })),

      addSpeechBubble: (bubble) =>
        set((state) => ({
          speechBubbles: [...state.speechBubbles.slice(-2), {
            ...bubble,
            id: generateId(),
            createdAt: Date.now(),
          }],
        })),

      removeSpeechBubble: (id) =>
        set((state) => ({
          speechBubbles: state.speechBubbles.filter((b) => b.id !== id),
        })),

      clearSpeechBubbles: () => set({ speechBubbles: [] }),

      setFirstVisit: (isFirstVisit) => {
        if (!isFirstVisit) localStorage.setItem('tome-spirit-seen', '1');
        set({ isFirstVisit });
      },

      setLastMousePosition: (pos) => set({ lastMousePosition: pos }),
      setMouseMoving: (moving) => set({ isMouseMoving: moving }),
    }),
    {
      name: 'tome-spirit',
      partialize: (state) => ({
        mode: state.mode,
        isOpen: state.isOpen,
        isPinned: state.isPinned,
        position: state.position,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        preferences: state.preferences,
        isFirstVisit: state.isFirstVisit,
      }),
    },
  ),
);
