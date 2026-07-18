'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PanelRightClose, GripVertical } from 'lucide-react';
import { useSpiritStore } from '@fluid/spirit';
import { SpiritChat } from './spirit-chat';

export function SpiritDock() {
  const { isOpen, mode, close, preferences, context } = useSpiritStore();

  const show = mode === 'docked' && isOpen;
  const width = preferences.dockWidth;

  return (
    <AnimatePresence>
      {show && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="h-full border-l border-theme-border bg-theme-card overflow-hidden flex flex-col shrink-0"
          style={{ minWidth: 0 }}
        >
          {/* Resize handle */}
          <div className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize group">
            <div className="w-full h-full group-hover:bg-theme-accent/30 transition-colors" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-theme-border shrink-0">
            <div className="flex items-center gap-2 text-xs text-theme-muted">
              <GripVertical className="h-3 w-3" />
              <span>Tome Spirit</span>
            </div>
            <button
              onClick={close}
              className="p-1 rounded-md text-theme-muted hover:bg-theme-hover hover:text-theme-main transition-colors"
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-hidden">
            <SpiritChat pageId={context.currentPage?.id} />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
