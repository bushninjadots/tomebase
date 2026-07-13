'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, ArrowRight } from 'lucide-react';

interface Result {
  id: string;
  title: string;
  slug: string;
  snippet: string;
  score: number;
}

interface PublicSearchOverlayProps {
  projectId: string;
}

export function PublicSearchOverlay({ projectId }: PublicSearchOverlayProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/public/search?projectId=${projectId}&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 150);
    return () => clearTimeout(debounceRef.current);
  }, [query, projectId]);

  const navigate = useCallback(
    (slug: string) => {
      setOpen(false);
      router.push(`/p/${projectId}/${slug}`);
    },
    [router, projectId]
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
        className="flex items-center gap-2 rounded-lg border border-theme-border px-3 py-1.5 text-sm text-theme-muted hover:border-theme-border hover:text-theme-subtle transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search docs...</span>
        <kbd className="ml-2 rounded border border-theme-border bg-theme-card px-1.5 py-0.5 text-[10px] font-medium text-theme-muted">
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
          <div className="w-full max-w-lg rounded-2xl border border-theme-border bg-theme-card shadow-2xl">
            <div className="flex items-center gap-3 border-b border-theme-border px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-theme-muted" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search docs..."
                className="flex-1 bg-transparent text-sm text-theme-main outline-none placeholder:text-theme-muted"
                autoFocus
              />
              <kbd className="shrink-0 rounded border border-theme-border px-1.5 py-0.5 text-[10px] font-medium text-theme-muted">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {loading && (
                <p className="py-6 text-center text-sm text-theme-muted">Searching...</p>
              )}
              {!loading && results.length === 0 && query.trim() && (
                <p className="py-6 text-center text-sm text-theme-muted">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}
              {!loading && results.length === 0 && !query.trim() && (
                <p className="py-6 text-center text-sm text-theme-muted">
                  Start typing to search docs
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
                      : 'text-theme-subtle hover:bg-theme-hover'
                  }`}
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-theme-muted" />
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
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-theme-muted" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
