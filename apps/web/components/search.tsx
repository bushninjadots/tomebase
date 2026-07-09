'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, ArrowRight } from 'lucide-react';

interface SearchPage {
  id: string;
  title: string;
  slug: string;
  content: string;
}

interface SearchOverlayProps {
  projectId: string;
  pages: SearchPage[];
}

export function SearchOverlay({ projectId, pages }: SearchOverlayProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = (() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return pages
      .map((p) => {
        const titleMatch = p.title.toLowerCase().includes(lower);
        const contentMatch = p.content.toLowerCase().includes(lower);
        let score = 0;
        if (titleMatch) score += 10;
        if (contentMatch) score += 1;
        const idx = p.content.toLowerCase().indexOf(lower);
        const snippet =
          idx >= 0
            ? p.content.slice(Math.max(0, idx - 40), idx + 80)
            : '';
        return { ...p, score, snippet };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  })();

  const navigate = useCallback(
    (slug: string) => {
      setOpen(false);
      router.push(`/docs/${projectId}/${slug}`);
      router.refresh();
    },
    [projectId, router]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      navigate(results[selectedIdx]!.slug);
    }
  }

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search pages...</span>
        <kbd className="ml-6 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-[15vh]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages by title or content..."
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                autoFocus
              />
              <kbd className="shrink-0 rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                ESC
              </kbd>
            </div>

            <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && query.trim() && (
                <p className="py-6 text-center text-sm text-gray-400">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}
              {results.length === 0 && !query.trim() && (
                <p className="py-6 text-center text-sm text-gray-400">
                  Start typing to search pages
                </p>
              )}
              {results.map((result, idx) => (
                <button
                  key={result.id}
                  onClick={() => navigate(result.slug)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    idx === selectedIdx
                      ? 'bg-fluid-50 text-fluid-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{result.title}</span>
                      {result.score >= 10 && (
                        <span className="rounded bg-fluid-100 px-1.5 py-0.5 text-[10px] font-medium text-fluid-600">
                          Title match
                        </span>
                      )}
                    </div>
                    {result.snippet && (
                      <p className="mt-0.5 truncate text-xs text-gray-400">
                        {result.snippet}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
