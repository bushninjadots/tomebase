'use client';

import { useState, useEffect } from 'react';
import { Keyboard, Bold, Eye, FileText, ArrowLeft, Table, X } from 'lucide-react';

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
      { keys: '\u2318K', desc: 'Search pages (project-wide)' },
      { keys: '\u2318\u21E7K', desc: 'Search across all projects' },
      { keys: 'Esc', desc: 'Close modals / cancel' },
      { keys: 'Ctrl+/', desc: 'Show this help' },
    ],
  },
  {
    title: 'Editing',
    icon: FileText,
    items: [
      { keys: '\u2318S', desc: 'Save current page' },
      { keys: '\u2318Z', desc: 'Undo' },
      { keys: '\u2318\u21E7Z', desc: 'Redo' },
      { keys: 'Tab', desc: 'Indent line' },
      { keys: 'Shift+Tab', desc: 'Outdent line' },
      { keys: '\u2318/', desc: 'Toggle comment (line)' },
    ],
  },
  {
    title: 'Formatting',
    icon: Bold,
    items: [
      { keys: '\u2318B', desc: 'Bold text (**text**)' },
      { keys: '\u2318I', desc: 'Italic text (*text*)' },
      { keys: '`', desc: 'Inline code' },
      { keys: '\u2318\u21E7P', desc: 'Cycle Edit \u2192 Preview \u2192 Split' },
      { keys: '/', desc: 'Slash commands (at line start)' },
    ],
  },
  {
    title: 'View',
    icon: Eye,
    items: [
      { keys: '\u2318\\', desc: 'Toggle zen mode (distraction-free)' },
      { keys: '\u2318\u21E7P', desc: 'Cycle view modes' },
    ],
  },
  {
    title: 'Features',
    icon: Table,
    items: [
      { keys: '[[', desc: 'Wiki link (type [[ to autocomplete)' },
      { keys: '@', desc: 'Mention a team member in comments' },
      { keys: 'Paste', desc: 'Paste image from clipboard' },
      { keys: 'Drag', desc: 'Drag & drop image into editor' },
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
        className="rounded-lg p-1.5 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors relative"
        title="Keyboard shortcuts (Ctrl/)"
      >
        <Keyboard className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-theme-border bg-theme-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-theme-border px-5 py-3">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-theme-accent" />
                <h3 className="text-sm font-semibold text-theme-main">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-3 space-y-3">
              {GROUPS.map((group) => (
                <div key={group.title}>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium uppercase tracking-wider text-theme-muted">
                    <group.icon className="h-3 w-3" />
                    {group.title}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <div
                        key={item.desc}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                      >
                        <span className="text-theme-subtle">{item.desc}</span>
                        <kbd className="shrink-0 ml-3 rounded border border-theme-border bg-theme-card px-1.5 py-0.5 text-[11px] font-medium text-theme-muted">
                          {item.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-theme-border px-5 py-2.5 text-xs text-theme-muted text-center">
              Press <kbd className="rounded border border-theme-border bg-theme-card px-1 py-0.5 text-[10px] font-medium text-theme-muted mx-0.5">Ctrl/</kbd> to toggle this menu anytime
            </div>
          </div>
        </div>
      )}
    </>
  );
}
