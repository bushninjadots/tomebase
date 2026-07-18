'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSpiritStore } from '@fluid/spirit';
import { SpiritGhost } from './spirit-ghost';
import { SpiritWindow } from './spirit-window';

export function SpiritBubble() {
  const { position, setPosition, aiState, toggle, preferences } = useSpiritStore();

  const handleDragEnd = useCallback(
    (_: unknown, info: { point: { x: number; y: number } }) => {
      const { x, y } = info.point;
      const snapMargin = 16;
      const maxX = window.innerWidth - 64;
      const maxY = window.innerHeight - 80;
      setPosition({
        x: Math.max(snapMargin, Math.min(x, maxX)),
        y: Math.max(snapMargin, Math.min(y, maxY)),
      });
    },
    [setPosition],
  );

  const opacity = preferences.opacity / 100;
  const windowWidth = 400;

  // Position chat window: prefer left of bubble, fallback right if near left edge
  const showRight = position.x < windowWidth + 32;

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[9998]" />

      <motion.div
        drag
        dragMomentum
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        initial={false}
        animate={{
          x: position.x,
          y: position.y,
          opacity,
          scale: 1,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ position: 'fixed', zIndex: 9999, cursor: 'grab' }}
        className="select-none"
        onClick={toggle}
      >
        <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-theme-card border border-theme-border shadow-lg hover:shadow-xl transition-shadow">
          <SpiritGhost state={aiState} size="small" />
          {aiState === 'thinking' && (
            <motion.span
              className="absolute inset-0 rounded-2xl border border-theme-accent/30"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
      </motion.div>

      <div
        style={{
          position: 'fixed',
          zIndex: 9999,
          [showRight ? 'left' : 'right']: showRight ? position.x + 64 : window.innerWidth - position.x + 8,
          bottom: window.innerHeight - position.y - 8,
        }}
      >
        <SpiritWindow />
      </div>
    </>
  );
}
