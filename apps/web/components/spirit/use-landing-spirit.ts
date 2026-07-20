'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSpiritStore } from '@fluid/spirit';

const COMMENT_COOLDOWN_MS = 8000;
const WELCOME_DELAY_MS = 1500;
const IDLE_TIMEOUT_MS = 30000;

const sectionComments: Record<string, string> = {
  features: 'Ooh, good taste! These are my favorites.',
  pricing: 'The Pro plan is a steal. Just saying.',
  'how-it-works': 'Three steps to beautiful docs. Easy.',
  faq: 'Curious, are we? I like that.',
  stats: 'Numbers go brrr.',
};

const idleComments = [
  'Still browsing? I don\'t bite.',
  'Psst. Click the demo. Trust me.',
  'I could write your docs, you know.',
  'You\'re being very thorough. I respect that.',
  'The interactive demo is fun. Just saying.',
];

export function useLandingSpirit() {
  const pathname = usePathname();
  const setLandingComment = useSpiritStore((s) => s.setLandingComment);
  const lastCommentRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownIdleRef = useRef(false);

  const isLanding = pathname === '/';

  useEffect(() => {
    if (!isLanding) return;

    const welcomeTimer = setTimeout(() => {
      setLandingComment('Hey there! I\'m your ghost assistant.');
    }, WELCOME_DELAY_MS);

    return () => clearTimeout(welcomeTimer);
  }, [isLanding, setLandingComment]);

  useEffect(() => {
    if (!isLanding) return;

    function canComment() {
      return Date.now() - lastCommentRef.current > COMMENT_COOLDOWN_MS;
    }

    function show(text: string) {
      if (!canComment()) return;
      lastCommentRef.current = Date.now();
      setLandingComment(text);
    }

    function onScroll() {
      const sections = document.querySelectorAll('section[id]');
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 200 && rect.bottom >= 200) {
          const id = section.getAttribute('id');
          if (id && sectionComments[id]) {
            show(sectionComments[id]);
            break;
          }
        }
      }
    }

    function onSelect(e: MouseEvent) {
      if (e.detail === 0) return;
      setTimeout(() => {
        const sel = window.getSelection()?.toString().trim();
        if (sel && sel.length > 10) {
          show('Need help with that? Just ask me!');
        }
      }, 100);
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const details = target.closest('details');
      if (details) {
        show('Good question! Here\'s the answer.');
        return;
      }

      const demo = target.closest('[data-interactive-demo]');
      if (demo) {
        show('Let me show you what I can do!');
        return;
      }

      if (target.closest('a[href="/login"]') || target.closest('a[href="/onboarding"]')) {
        show('Great choice! Let\'s get started!');
        return;
      }
    }

    function resetIdle() {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      shownIdleRef.current = false;
      idleTimerRef.current = setTimeout(() => {
        if (!shownIdleRef.current) {
          shownIdleRef.current = true;
          const pick = idleComments[Math.floor(Math.random() * idleComments.length)]!;
          show(pick);
        }
      }, IDLE_TIMEOUT_MS);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick);
    document.addEventListener('mouseup', onSelect);
    resetIdle();

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick);
      document.removeEventListener('mouseup', onSelect);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isLanding, setLandingComment]);
}
