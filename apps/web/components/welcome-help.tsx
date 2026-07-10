'use client';

import { useState, useEffect } from 'react';
import { Keyboard, Search, FileText, Bold, ArrowRight, BookOpen, X, ChevronRight } from 'lucide-react';

const TIPS = [
  {
    icon: Search,
    title: 'Search everything with ⌘K',
    desc: 'Press Cmd+K (or Ctrl+K on Windows) to search pages from anywhere. From the dashboard, it searches across all your projects.',
  },
  {
    icon: Keyboard,
    title: 'Press ⌘/ for shortcuts',
    desc: 'Every keyboard shortcut is listed in the help panel. Press Cmd+/ anytime to see them.',
  },
  {
    icon: BookOpen,
    title: 'Wiki links: [[ like this ]]',
    desc: 'Type double brackets [[ in the editor to link to another page. Autocomplete shows you matching pages.',
  },
  {
    icon: FileText,
    title: 'Four ways to create pages',
    desc: 'Write from scratch, import TypeScript/JS code, import OpenAPI specs, or sync from a GitHub repo.',
  },
];

export function WelcomeHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('tomebase-welcome-seen');
    if (!seen) {
      const timer = setTimeout(() => {
        setOpen(true);
        localStorage.setItem('tomebase-welcome-seen', 'true');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-fluid-600" />
            <h3 className="text-sm font-semibold text-gray-900">Welcome to TomeBase</h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {TIPS.map((tip, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fluid-50 text-fluid-600">
                <tip.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{tip.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 px-5 py-3">
          <button
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Got it
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
