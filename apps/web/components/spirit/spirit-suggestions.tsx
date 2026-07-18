'use client';

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, AlertTriangle, Info } from 'lucide-react';
import { useSpiritStore } from '@fluid/spirit';

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  action: Lightbulb,
};

const COLORS = {
  info: 'border-blue-500/20 bg-blue-500/5',
  warning: 'border-amber-500/20 bg-amber-500/5',
  action: 'border-theme-accent/20 bg-theme-accent/5',
};

const TEXT_COLORS = {
  info: 'text-blue-400',
  warning: 'text-amber-400',
  action: 'text-theme-accent',
};

export function SpiritSuggestions() {
  const { suggestions, dismissSuggestion, preferences } = useSpiritStore();

  if (!preferences.autoSuggestions || suggestions.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 z-[9997] space-y-2 max-w-sm">
      <AnimatePresence>
        {suggestions.slice(-3).map((s) => {
          const Icon = ICONS[s.type];
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              className={`flex items-start gap-2.5 rounded-xl border p-3 ${COLORS[s.type]} backdrop-blur-sm`}
            >
              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${TEXT_COLORS[s.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-theme-subtle leading-relaxed">{s.message}</p>
                {s.action && (
                  <button
                    onClick={s.action.handler}
                    className="mt-1.5 text-xs font-medium text-theme-accent hover:underline"
                  >
                    {s.action.label}
                  </button>
                )}
              </div>
              {s.dismissible && (
                <button
                  onClick={() => dismissSuggestion(s.id)}
                  className="p-0.5 rounded text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
