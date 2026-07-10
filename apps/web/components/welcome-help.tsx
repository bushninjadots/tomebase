'use client';

import { useState, useEffect } from 'react';
import { X, Search, Keyboard, BookOpen, FileUp } from 'lucide-react';

const tips = [
  { icon: Search, title: 'Global Search', description: 'Press ⌘K to search across all your projects and pages instantly.' },
  { icon: Keyboard, title: 'Keyboard Shortcuts', description: 'Press ⌘/ in the editor to see all available shortcuts.' },
  { icon: BookOpen, title: 'Wiki Links', description: 'Link pages together with [[Page Title]] syntax. Visualize connections in the Graph View.' },
  { icon: FileUp, title: 'Import Files', description: 'Import Markdown, TypeScript, or OpenAPI specs from the sidebar or project settings.' },
];

export function WelcomeHelp() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('fluid-welcome-dismissed');
    if (!dismissed) setShow(true);
  }, []);

  function handleClose() {
    setShow(false);
    localStorage.setItem('fluid-welcome-dismissed', 'true');
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-theme-border bg-theme-page shadow-2xl mx-4">
        <div className="flex items-center justify-between border-b border-theme-border px-6 py-4">
          <h2 className="text-lg font-semibold text-theme-main">Welcome to TomeBase</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-6 py-5">
          {tips.map((tip) => (
            <div key={tip.title} className="flex items-start gap-3 rounded-xl border border-theme-border bg-theme-card/50 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fluid-50 text-fluid-600">
                <tip.icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-theme-main">{tip.title}</h3>
                <p className="text-sm text-theme-subtle mt-0.5">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-theme-border px-6 py-4">
          <button
            onClick={handleClose}
            className="rounded-lg bg-theme-main px-4 py-2 text-sm font-medium text-theme-page hover:opacity-80 transition-opacity"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
