'use client';

import { useState, useEffect } from 'react';
import { Keyboard, Search, Save, Bold, Italic, Code, Eye, MessageSquare, FileText, ArrowLeft } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  icon: React.ElementType;
  items: { keys: string; desc: string }[];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    icon: ArrowLeft,
    items: [
      { keys: '⌘K', desc: 'Search pages (project-wide)' },
      { keys: '⌘⇧K', desc: 'Search across all projects' },
      { keys: 'Esc', desc: 'Close modals / cancel' },
    ],
  },
  {
    title: 'Editing',
    icon: FileText,
    items: [
      { keys: '⌘S', desc: 'Save current page' },
      { keys: '⌘Z', desc: 'Undo' },
      { keys: '⌘⇧Z', desc: 'Redo' },
      { keys: 'Tab', desc: 'Indent selected lines' },
      { keys: '⇧Tab', desc: 'Outdent selected lines' },
    ],
  },
  {
    title: 'Formatting',
    icon: Bold,
    items: [
      { keys: '⌘B', desc: 'Bold text (**text**)' },
      { keys: '⌘I', desc: 'Italic text (*text*)' },
      { keys: '`', desc: 'Inline code' },
      { keys: '⌘⇧P', desc: 'Cycle Edit → Preview → Split' },
    ],
  },
  {
    title: 'Features',
    icon: Eye,
    items: [
      { keys: '⌘/', desc: 'Show this help' },
      { keys: '[[', desc: 'Wiki link (type [[ to autocomplete)' },
      { keys: '@', desc: 'Mention a team member in comments' },
    ],
  },
];

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);
  const [firstVisit, setFirstVisit] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem('tomebase-shortcuts-seen');
    if (seen) {
      setFirstVisit(false);
    } else {
      // Auto-show on first visit after a short delay
      const timer = setTimeout(() => {
        setOpen(true);
        localStorage.setItem('tomebase-shortcuts-seen', 'true');
        setFirstVisit(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

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
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors relative"
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
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-fluid-600" />
                <h3 className="text-sm font-semibold text-gray-900">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <Keyboard className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-3 space-y-3">
              {GROUPS.map((group) => (
                <div key={group.title}>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                    <group.icon className="h-3 w-3" />
                    {group.title}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <div
                        key={item.desc}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                      >
                        <span className="text-gray-600">{item.desc}</span>
                        <kbd className="shrink-0 ml-3 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                          {item.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 px-5 py-2.5 text-xs text-gray-400 text-center">
              Press <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[10px] font-medium text-gray-500 mx-0.5">⌘/</kbd> to toggle this menu anytime
            </div>
          </div>
        </div>
      )}
    </>
  );
}
