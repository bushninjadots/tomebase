'use client';

import { useEffect, useRef } from 'react';
import { useSpiritStore } from '@fluid/spirit';
import { eventBus } from '@/lib/events';

const AMBIENT_COMMENTS = [
  'Need help with anything?',
  'I can help you write docs!',
  'Try selecting some text and asking me about it.',
  'Your docs are looking great today.',
  'I know a thing or two about markdown.',
  'Want me to run a health check?',
  "I'm always here if you need me.",
  'Nice documentation work!',
];

const AMBIENT_MIN_MS = 2_000;
const AMBIENT_MAX_MS = 5_000;
const SLEEP_TIMEOUT_MS = 60_000;
const GREETING_DELAY_MS = 2_000;
const STATE_RESET_MS = 2_000;

interface UseSpiritBehaviorOptions {
  enabled: boolean;
}

function randomAmbientDelay(): number {
  return AMBIENT_MIN_MS + Math.random() * (AMBIENT_MAX_MS - AMBIENT_MIN_MS);
}

function randomComment(): string {
  const idx = Math.floor(Math.random() * AMBIENT_COMMENTS.length);
  return AMBIENT_COMMENTS[idx] ?? 'Need help with anything?';
}

export function useSpiritBehavior({ enabled }: UseSpiritBehaviorOptions) {
  const ambientTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteractionRef = useRef(Date.now());
  const previousScoreRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const store = useSpiritStore.getState();

    // --- First-time greeting ---
    if (store.isFirstVisit) {
      const greetingTimer = setTimeout(() => {
        const s = useSpiritStore.getState();
        if (!s.isOpen) {
          s.addSpeechBubble({
            text: "Hey there! I'm your ghost assistant. 👋",
            variant: 'greeting',
            duration: 5000,
          });
        }
        s.setFirstVisit(false);
      }, GREETING_DELAY_MS);

      return () => clearTimeout(greetingTimer);
    }
  }, [enabled]);

  // --- Wake from sleep ---
  useEffect(() => {
    if (!enabled) return;

    let prevAiState = useSpiritStore.getState().aiState;

    const unsubscribe = useSpiritStore.subscribe((state) => {
      if (prevAiState === 'sleeping' && state.aiState === 'idle') {
        useSpiritStore.getState().addSpeechBubble({
          text: 'Oh! Hey, I was just resting my eyes.',
          variant: 'greeting',
          duration: 4000,
        });
      }
      prevAiState = state.aiState;
    });

    return unsubscribe;
  }, [enabled]);

  // --- Health scan reactions ---
  useEffect(() => {
    if (!enabled) return;

    const unsubScan = eventBus.on('health:scanned', ({ score, previousScore }) => {
      const store = useSpiritStore.getState();

      if (score >= 80) {
        store.setAIState('excited');
        setTimeout(() => {
          useSpiritStore.getState().setAIState('idle');
        }, STATE_RESET_MS);
      } else if (score < 50) {
        store.setAIState('sad');
        setTimeout(() => {
          useSpiritStore.getState().setAIState('idle');
        }, STATE_RESET_MS);
      }

      if (previousScore !== null && score > previousScore) {
        const delta = score - previousScore;
        store.setAIState('celebrating');
        setTimeout(() => {
          useSpiritStore.getState().setAIState('idle');
        }, STATE_RESET_MS);

        if (!store.isOpen) {
          store.addSpeechBubble({
            text: `Nice work! Score went up ${delta} points! 🎉`,
            variant: 'reaction',
            duration: 4000,
          });
        }
        return;
      }

      if (!store.isOpen) {
        if (score >= 80) {
          store.addSpeechBubble({
            text: `Looking good! Score: ${score}/100 ✨`,
            variant: 'reaction',
            duration: 4000,
          });
        } else if (score < 50) {
          store.addSpeechBubble({
            text: `Oof. Score: ${score}/100. We should fix some things.`,
            variant: 'reaction',
            duration: 5000,
          });
        }
      }

      previousScoreRef.current = score;
    });

    return () => unsubScan();
  }, [enabled]);

  // --- Ambient comments ---
  useEffect(() => {
    if (!enabled) return;

    function scheduleAmbient() {
      ambientTimerRef.current = setTimeout(() => {
        const store = useSpiritStore.getState();
        if (
          store.aiState === 'idle' &&
          !store.isOpen &&
          store.speechBubbles.length === 0
        ) {
          store.addSpeechBubble({
            text: randomComment(),
            variant: 'ambient',
            duration: 4000,
          });
        }
        scheduleAmbient();
      }, randomAmbientDelay());
    }

    scheduleAmbient();

    return () => {
      if (ambientTimerRef.current) {
        clearTimeout(ambientTimerRef.current);
        ambientTimerRef.current = null;
      }
    };
  }, [enabled]);

  // --- Sleep after inactivity ---
  useEffect(() => {
    if (!enabled) return;

    function resetSleepTimer() {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }
      sleepTimerRef.current = setTimeout(() => {
        const store = useSpiritStore.getState();
        if (store.aiState === 'idle') {
          store.setAIState('sleeping');
        }
      }, SLEEP_TIMEOUT_MS);
    }

    function onMouseMove() {
      lastInteractionRef.current = Date.now();
      const store = useSpiritStore.getState();
      if (store.aiState === 'sleeping') {
        store.setAIState('idle');
      }
      resetSleepTimer();
    }

    resetSleepTimer();
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
        sleepTimerRef.current = null;
      }
    };
  }, [enabled]);

  // --- Track document saves for occasional reaction ---
  useEffect(() => {
    if (!enabled) return;

    const unsubSaved = eventBus.on('document:saved', () => {
      if (Math.random() > 0.3) return;
      const store = useSpiritStore.getState();
      if (!store.isOpen && store.aiState === 'idle' && store.speechBubbles.length === 0) {
        store.addSpeechBubble({
          text: 'Nice save! 📝',
          variant: 'reaction',
          duration: 3000,
        });
      }
    });

    return () => unsubSaved();
  }, [enabled]);
}
