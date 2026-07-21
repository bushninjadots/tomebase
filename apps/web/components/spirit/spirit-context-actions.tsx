'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileText,
  RefreshCw,
  Pen,
  MessageSquare,
} from 'lucide-react';
import { useSpiritStore } from '@fluid/spirit';

interface ContextAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: string;
}

const ACTIONS: ContextAction[] = [
  { id: 'explain', label: 'Explain', icon: <FileText className="h-3.5 w-3.5" />, action: 'explain' },
  { id: 'rewrite', label: 'Rewrite', icon: <RefreshCw className="h-3.5 w-3.5" />, action: 'rewrite' },
  { id: 'improve', label: 'Improve', icon: <Pen className="h-3.5 w-3.5" />, action: 'improve' },
];

export function SpiritContextActions() {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const { open, setContext, preferences } = useSpiritStore();

  useEffect(() => {
    function handleSelection() {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!text || text.length < 3) {
        setShow(false);
        return;
      }

      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (!rect) {
        setShow(false);
        return;
      }

      setSelectedText(text);
      setPosition({ x: rect.left + rect.width / 2, y: rect.top - 8 });
      setShow(true);
    }

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  const handleAction = useCallback(
    (action: string) => {
      setContext({ currentSelection: selectedText });
      const safeText = selectedText || '';
      const prompts: Record<string, string> = {
        explain: `Explain this text: "${safeText}"`,
        rewrite: `Rewrite this text for clarity: "${safeText}"`,
        improve: `Improve this text: "${safeText}"`,
        ask: `About this text: "${safeText}"`,
      };
      useSpiritStore.getState().setPendingInput(prompts[action] ?? `About this text: "${safeText}"`);
      open();
      setShow(false);
    },
    [selectedText, setContext, open],
  );

  if (!preferences.enabled) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 4 }}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 9998,
          }}
          className="flex items-center gap-0.5 rounded-xl border border-theme-border bg-theme-card shadow-lg p-1"
        >
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.action)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-theme-muted hover:bg-theme-hover hover:text-theme-main transition-colors whitespace-nowrap"
            >
              {action.icon}
              {action.label}
            </button>
          ))}
          <div className="w-px h-4 bg-theme-border mx-0.5" />
          <button
            onClick={() => handleAction('ask')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-theme-accent hover:bg-theme-accent/10 transition-colors whitespace-nowrap"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Ask Spirit
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
