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
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - 100;
      setPosition({
        x: Math.max(snapMargin, Math.min(x, maxX)),
        y: Math.max(snapMargin, Math.min(y, maxY)),
      });
    },
    [setPosition],
  );

  const opacity = preferences.opacity / 100;
  const windowWidth = 400;
  const showRight = position.x < windowWidth + 32;

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[9998]" />

      <motion.div
        drag
        dragMomentum
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          x: position.x,
          y: position.y,
          opacity,
          scale: 1,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{ position: 'fixed', zIndex: 9999, cursor: 'grab' }}
        className="select-none"
        onClick={toggle}
      >
        {/* Floating idle animation */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-theme-card border-2 border-theme-accent/30 shadow-lg hover:shadow-xl hover:border-theme-accent/50 transition-all">
            <SpiritGhost state={aiState} size="medium" />
            {aiState === 'thinking' && (
              <motion.span
                className="absolute inset-0 rounded-2xl border-2 border-theme-accent/40"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
        </motion.div>
      </motion.div>

      <div
        style={{
          position: 'fixed',
          zIndex: 9999,
          [showRight ? 'left' : 'right']: showRight ? position.x + 72 : window.innerWidth - position.x + 8,
          bottom: window.innerHeight - position.y - 12,
        }}
      >
        <SpiritWindow />
      </div>
    </>
  );
}
