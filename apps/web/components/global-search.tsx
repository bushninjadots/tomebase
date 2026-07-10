'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, ArrowRight } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  projectId: string;
  projectName: string;
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setResults([]);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setSelectedIdx(0);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  function navigate(result: SearchResult) {
    setOpen(false);
    router.push(`/docs/${result.projectId}/${result.slug}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      e.preventDefault();
      navigate(results[selectedIdx]);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-theme-border bg-theme-page px-3 py-1.5 text-sm text-theme-muted hover:border-gray-300 hover:text-theme-subtle transition-colors w-full max-w-sm"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search all projects...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-theme-border bg-theme-card px-1.5 py-0.5 text-xs text-theme-muted">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl border border-theme-border bg-theme-page shadow-2xl">
            <div className="flex items-center gap-3 border-b border-theme-border px-4 py-3">
              <Search className="h-4 w-4 text-theme-muted shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages..."
                className="flex-1 bg-transparent text-sm text-theme-main outline-none placeholder:text-theme-muted"
                autoFocus
              />
              {loading && <span className="text-xs text-theme-muted shrink-0">Searching...</span>}
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-theme-muted hover:bg-theme-hover"
              >
                <kbd className="text-xs text-theme-muted">ESC</kbd>
              </button>
            </div>

            {results.length > 0 && (
              <div className="max-h-80 overflow-y-auto p-2">
                {results.map((result, i) => (
                  <button
                    key={result.id}
                    onClick={() => navigate(result)}
                    onMouseEnter={() => setSelectedIdx(i)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      i === selectedIdx ? 'bg-theme-hover' : 'hover:bg-theme-card'
                    }`}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-theme-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-theme-main">{result.title}</p>
                      <p className="truncate text-xs text-theme-muted">{result.projectName}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />
                  </button>
                ))}
              </div>
            )}

            {query.length >= 2 && results.length === 0 && !loading && (
              <div className="p-6 text-center text-sm text-theme-muted">No pages found.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
