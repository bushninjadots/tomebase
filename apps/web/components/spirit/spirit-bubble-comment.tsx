'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpiritStore } from '@fluid/spirit';

const DISMISS_MS = 5000;

export function SpiritBubbleComment() {
  const comment = useSpiritStore((s) => s.landingComment);
  const clear = useSpiritStore((s) => s.clearLandingComment);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (comment) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(clear, 300);
      }, DISMISS_MS);
      return () => clearTimeout(timer);
    }
  }, [comment, clear]);

  return (
    <AnimatePresence>
      {visible && comment && (
        <motion.div
          key={comment.id}
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="fixed z-[9998] pointer-events-none"
          style={{ bottom: 96, right: 20 }}
        >
          <div className="relative max-w-[220px]">
            <div
              className="rounded-2xl px-4 py-2.5 text-sm leading-snug
                bg-theme-card border border-theme-border shadow-lg
                text-theme-main"
            >
              {comment.text}
            </div>
            <div
              className="absolute -bottom-1.5 right-5 w-3 h-3 rotate-45
                bg-theme-card border-r border-b border-theme-border"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
