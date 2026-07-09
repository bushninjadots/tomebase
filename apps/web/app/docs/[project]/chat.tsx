'use client';

import { useState } from 'react';
import { MessageSquare, X, Sparkles } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

export function ChatPanel({ project: _project }: { project: Project }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-fluid-600 text-white shadow-lg hover:bg-fluid-700 transition-all hover:scale-105"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      )}

      {isOpen && (
        <aside className="flex w-96 flex-col border-l border-gray-100 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-fluid-600" />
              <span className="text-sm font-semibold text-gray-900">Fluid AI</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
              <Sparkles className="mx-auto h-10 w-10 text-gray-200" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">AI Chat</h3>
              <p className="mt-2 text-sm text-gray-500">
                Ask questions about your documentation and get instant answers.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                Coming Soon
              </span>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
