'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useSpiritStore } from '@fluid/spirit';
import { SpiritChat } from './spirit-chat';

const WINDOW_WIDTH = 400;
const WINDOW_HEIGHT = 540;
const WINDOW_GAP = 12;

interface SpiritWindowProps {
  position: { x: number; y: number };
  bubbleSize: number;
  showLeft: boolean;
  projectId?: string;
}

export function SpiritWindow({ position, bubbleSize, showLeft, projectId }: SpiritWindowProps) {
  const { isOpen, close, mode, context } = useSpiritStore();
  const show = isOpen && mode === 'floating';

  // Compute window position so it's fully visible in viewport
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1280;

  // Vertical: prefer aligning window top with bubble top
  let windowTop = position.y;
  if (windowTop + WINDOW_HEIGHT > viewportH - 20) {
    windowTop = viewportH - WINDOW_HEIGHT - 20;
  }
  if (windowTop < 20) {
    windowTop = 20;
  }

  const windowStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    maxHeight: `calc(100vh - 40px)`,
    top: windowTop,
    ...(showLeft
      ? { left: position.x + bubbleSize + WINDOW_GAP }
      : { right: viewportW - position.x + WINDOW_GAP }),
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={windowStyle}
          className="rounded-2xl border border-theme-border bg-theme-card shadow-2xl overflow-hidden flex flex-col"
        >
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
            projectId={projectId}
            pageId={context.currentPage?.id}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
