'use client';

import { useState } from 'react';
import { MessageSquare, X, Sparkles, Send, BookOpen, Search, FileText } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

const SUGGESTED_PROMPTS = [
  { icon: Search, label: 'Find all pages about authentication' },
  { icon: FileText, label: 'Summarize this documentation' },
  { icon: BookOpen, label: 'What are the API rate limits?' },
];

export function ChatPanel({ project: _project }: { project: Project }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-fluid-600 text-white shadow-lg hover:bg-fluid-700 transition-all hover:scale-105"
          aria-label="Open AI chat"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      )}

      {isOpen && (
        <aside className="flex w-96 flex-col border-l border-theme-border bg-theme-page">
          <div className="flex items-center justify-between border-b border-theme-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-fluid-600" />
              <span className="text-sm font-semibold text-theme-main">TomeBase AI</span>
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Coming Soon
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto p-4">
            <div className="mb-6 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-fluid-500" />
              <h3 className="mt-3 text-sm font-semibold text-theme-main">Ask anything about your docs</h3>
              <p className="mt-1 text-xs text-theme-muted">
                AI-powered search and writing assistant for your documentation.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-theme-muted uppercase tracking-wider">Try asking</p>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  disabled
                  className="flex w-full items-center gap-3 rounded-lg border border-theme-border bg-theme-card px-3 py-2.5 text-left text-xs text-theme-subtle opacity-60 cursor-not-allowed"
                >
                  <prompt.icon className="h-3.5 w-3.5 shrink-0 text-theme-muted" />
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-theme-border p-3">
            <div className="flex items-center gap-2 rounded-lg border border-theme-border bg-theme-card px-3 py-2 opacity-60">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question..."
                disabled
                className="flex-1 bg-transparent text-xs text-theme-main placeholder:text-theme-muted outline-none disabled:cursor-not-allowed"
              />
              <button
                disabled
                className="rounded p-1 text-theme-muted"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-theme-muted">
              AI assistant requires Pro plan
            </p>
          </div>
        </aside>
      )}
    </>
  );
}
