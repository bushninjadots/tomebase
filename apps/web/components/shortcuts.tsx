'use client';

import { useState, useEffect } from 'react';
import { Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['⌘K', 'Ctrl+K'], label: 'Search pages' },
  { keys: ['⌘S', 'Ctrl+S'], label: 'Save page' },
  { keys: ['⌘B', 'Ctrl+B'], label: 'Bold text' },
  { keys: ['⌘I', 'Ctrl+I'], label: 'Italic text' },
  { keys: ['⌘⇧P', 'Ctrl+Shift+P'], label: 'Cycle edit/preview/split' },
  { keys: ['⌘/', 'Ctrl+/'], label: 'Show shortcuts' },
  { keys: ['Esc'], label: 'Close modal / cancel' },
];

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        title="Keyboard shortcuts (⌘/)"
      >
        <Keyboard className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Keyboard Shortcuts</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <Keyboard className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              {SHORTCUTS.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                >
                  <span className="text-gray-600">{s.label}</span>
                  <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                    {s.keys[0]}
                  </kbd>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-5 py-2.5 text-xs text-gray-400 text-center">
              Press ⌘/ to toggle this menu
            </div>
          </div>
        </div>
      )}
    </>
  );
}
