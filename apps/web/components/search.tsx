'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
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
  const inputId = useId();

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
        aria-label="Open search (Control+K)"
        className="flex items-center gap-2 rounded-lg border border-theme-border bg-theme-hover px-3 py-1.5 text-sm text-theme-muted hover:border-theme-border hover:text-theme-subtle transition-colors"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Search pages...</span>
        <kbd className="ml-6 rounded border border-theme-border bg-theme-card px-1.5 py-0.5 text-[10px] font-medium text-theme-muted">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search pages"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-[15vh]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-theme-border bg-theme-card shadow-2xl">
            <div className="flex items-center gap-3 border-b border-theme-border px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-theme-muted" aria-hidden="true" />
              <input
                ref={inputRef}
                id={inputId}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages by title or content..."
                aria-label="Search pages by title or content"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="search-results"
                aria-activedescendant={
                  results[selectedIdx] ? `search-option-${results[selectedIdx]!.id}` : undefined
                }
                className="flex-1 bg-transparent text-sm text-theme-main outline-none placeholder:text-theme-muted"
                autoFocus
              />
              <kbd className="shrink-0 rounded border border-theme-border px-1.5 py-0.5 text-[10px] font-medium text-theme-muted">
                ESC
              </kbd>
            </div>

            <div
              ref={listRef}
              id="search-results"
              role="listbox"
              aria-label="Search results"
              className="max-h-80 overflow-y-auto p-2"
            >
              {results.length === 0 && query.trim() && (
                <p className="py-6 text-center text-sm text-theme-muted" role="status">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}
              {results.length === 0 && !query.trim() && (
                <p className="py-6 text-center text-sm text-theme-muted">
                  Start typing to search pages
                </p>
              )}
              {results.map((result, idx) => (
                <button
                  key={result.id}
                  id={`search-option-${result.id}`}
                  role="option"
                  aria-selected={idx === selectedIdx}
                  onClick={() => navigate(result.slug)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    idx === selectedIdx
                      ? 'bg-fluid-50 text-fluid-700'
                      : 'text-theme-subtle hover:bg-theme-hover'
                  }`}
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-theme-muted" aria-hidden="true" />
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
                      <p className="mt-0.5 truncate text-xs text-theme-muted">
                        {result.snippet}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-theme-muted" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
