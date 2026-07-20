'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useSpiritStore } from '@fluid/spirit';
import { SpiritChat } from './spirit-chat';

const WINDOW_WIDTH = 400;
const WINDOW_HEIGHT = 540;

interface SpiritWindowProps {
  position: { x: number; y: number };
  bubbleSize: number;
  showLeft: boolean;
}

export function SpiritWindow({ position, bubbleSize, showLeft }: SpiritWindowProps) {
  const { isOpen, close, mode, context } = useSpiritStore();
  const show = isOpen && mode === 'floating';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            zIndex: 9999,
            width: WINDOW_WIDTH,
            height: WINDOW_HEIGHT,
            maxHeight: 'calc(100vh - 120px)',
            ...(showLeft
              ? { left: position.x + bubbleSize + 12 }
              : { right: window.innerWidth - position.x + 12 }),
            bottom: window.innerHeight - position.y - bubbleSize,
          }}
          className="rounded-2xl border border-theme-border bg-theme-card shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="absolute top-3 right-3 z-10 p-1 rounded-lg text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <SpiritChat
            projectId={undefined}
            pageId={context.currentPage?.id}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
