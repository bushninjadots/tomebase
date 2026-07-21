'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpiritStore, type SpiritSpeechBubble } from '@fluid/spirit';

const BUBBLE_CONTAINER_SIZE = 56;
const BUBBLE_OFFSET = 12;
const VIEWPORT_PAD = 8;

const variantStyles: Record<
  SpiritSpeechBubble['variant'],
  { bg: string; border: string; text: string }
> = {
  ambient: {
    bg: 'bg-theme-card',
    border: 'border-theme-border',
    text: 'text-theme-main text-sm',
  },
  reaction: {
    bg: 'bg-theme-card',
    border: 'border-theme-border',
    text: 'text-theme-main text-sm',
  },
  greeting: {
    bg: 'bg-theme-card',
    border: 'border-theme-accent/40',
    text: 'text-theme-main text-base',
  },
  idle: {
    bg: 'bg-theme-card/80',
    border: 'border-theme-border/60',
    text: 'text-theme-subtle text-xs',
  },
};

export function SpiritSpeechBubble() {
  const speechBubbles = useSpiritStore((s) => s.speechBubbles);
  const position = useSpiritStore((s) => s.position);
  const removeSpeechBubble = useSpiritStore((s) => s.removeSpeechBubble);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    for (const bubble of speechBubbles) {
      if (timeoutsRef.current.has(bubble.id)) continue;
      const timeout = setTimeout(() => {
        removeSpeechBubble(bubble.id);
        timeoutsRef.current.delete(bubble.id);
      }, bubble.duration);
      timeoutsRef.current.set(bubble.id, timeout);
    }

    const activeIds = new Set(speechBubbles.map((b) => b.id));
    for (const [id, timeout] of timeoutsRef.current) {
      if (!activeIds.has(id)) {
        clearTimeout(timeout);
        timeoutsRef.current.delete(id);
      }
    }
  }, [speechBubbles, removeSpeechBubble]);

  useEffect(() => {
    const current = timeoutsRef.current;
    return () => {
      for (const timeout of current.values()) clearTimeout(timeout);
      current.clear();
    };
  }, []);

  const ghostCenterX = position.x + BUBBLE_CONTAINER_SIZE / 2;
  const ghostTop = position.y;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]">
      <AnimatePresence>
        {speechBubbles.map((bubble) => {
          const style = variantStyles[bubble.variant];
          const reactionTint =
            bubble.variant === 'reaction'
              ? 'bg-theme-accent/[0.05]'
              : '';

          return (
            <BubbleItem
              key={bubble.id}
              bubble={bubble}
              ghostCenterX={ghostCenterX}
              ghostTop={ghostTop}
              style={style}
              reactionTint={reactionTint}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function BubbleItem({
  bubble,
  ghostCenterX,
  ghostTop,
  style,
  reactionTint,
}: {
  bubble: SpiritSpeechBubble;
  ghostCenterX: number;
  ghostTop: number;
  style: { bg: string; border: string; text: string };
  reactionTint: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const bubbleWidth = ref.current?.offsetWidth ?? 120;
  const bubbleHeight = ref.current?.offsetHeight ?? 40;

  const idealLeft = ghostCenterX - bubbleWidth / 2;
  const clampedLeft = Math.max(
    VIEWPORT_PAD,
    Math.min(idealLeft, window.innerWidth - bubbleWidth - VIEWPORT_PAD),
  );

  let flipBelow = false;
  let topPos = ghostTop - bubbleHeight - BUBBLE_OFFSET;
  if (topPos < VIEWPORT_PAD) {
    topPos = ghostTop + BUBBLE_CONTAINER_SIZE + BUBBLE_OFFSET;
    flipBelow = true;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={{ position: 'fixed', left: clampedLeft, top: topPos }}
      className="pointer-events-none"
    >
      <div className="relative max-w-[200px]">
        <div
          className={`rounded-xl px-4 py-2.5 leading-snug shadow-lg border
            ${style.bg} ${style.border} ${style.text} ${reactionTint}`}
        >
          {bubble.text}
        </div>
        <div
          className={`absolute w-3 h-3 rotate-45 border-theme-border
            ${flipBelow ? '-top-1.5 border-l border-t' : '-bottom-1.5 border-r border-b'}
            ${
              bubble.variant === 'greeting'
                ? 'bg-theme-card border-theme-accent/40'
                : bubble.variant === 'idle'
                  ? 'bg-theme-card/80 border-theme-border/60'
                  : 'bg-theme-card'
            }`}
          style={{
            left: Math.max(
              8,
              Math.min(ghostCenterX - clampedLeft - 6, bubbleWidth - 20),
            ),
          }}
        />
      </div>
    </motion.div>
  );
}
