'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useSpiritStore } from '@fluid/spirit';
import { SpiritChat } from './spirit-chat';

const WINDOW_WIDTH = 400;
const WINDOW_HEIGHT = 540;

export function SpiritWindow() {
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
            width: WINDOW_WIDTH,
            height: WINDOW_HEIGHT,
            maxHeight: 'calc(100vh - 160px)',
          }}
          className="absolute bottom-0 right-0 mb-2 rounded-2xl border border-theme-border bg-theme-card shadow-2xl overflow-hidden flex flex-col"
        >
          <SpiritChat
            projectId={undefined}
            pageId={context.currentPage?.id}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
