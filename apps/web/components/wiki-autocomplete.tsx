'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Hash, Plus, FileText } from 'lucide-react';

interface WikiAutocompleteProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  content: string;
  setContent: (val: string) => void;
  pages: { id: string; title: string; slug: string; description?: string | null }[];
}

export function WikiAutocomplete({
  textareaRef,
  content,
  setContent,
  pages,
}: WikiAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = pages
    .filter((p) => {
      const lower = query.toLowerCase();
      if (!lower) return true;
      const titleLower = p.title.toLowerCase();
      // Fuzzy match: check if all characters of query appear in order
      if (titleLower.includes(lower)) return true;
      let qi = 0;
      for (let ti = 0; ti < titleLower.length && qi < lower.length; ti++) {
        if (titleLower[ti] === lower[qi]) qi++;
      }
      return qi === lower.length;
    })
    .sort((a, b) => {
      const aLower = a.title.toLowerCase();
      const bLower = b.title.toLowerCase();
      const queryLower = query.toLowerCase();
      // Prioritize starts-with matches
      const aStarts = aLower.startsWith(queryLower);
      const bStarts = bLower.startsWith(queryLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      // Then includes matches
      const aIncludes = aLower.includes(queryLower);
      const bIncludes = bLower.includes(queryLower);
      if (aIncludes && !bIncludes) return -1;
      if (!aIncludes && bIncludes) return 1;
      return a.title.localeCompare(b.title);
    })
    .slice(0, 10);

  const insertLink = useCallback(
    (title: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const cursorPos = ta.selectionStart;
      const textBefore = content.slice(0, cursorPos);
      const lastOpen = textBefore.lastIndexOf('[[');
      if (lastOpen === -1) return;
      const beforeLink = content.slice(0, lastOpen);
      const afterCursor = content.slice(cursorPos);
      const replacement = `[[${title}]]`;
      setContent(beforeLink + replacement + afterCursor);
      setOpen(false);
      requestAnimationFrame(() => {
        ta.focus();
        const newPos = beforeLink.length + replacement.length;
        ta.setSelectionRange(newPos, newPos);
      });
    },
    [content, setContent, textareaRef],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filtered[activeIndex]) {
          insertLink(filtered[activeIndex]!.title);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, filtered, activeIndex, insertLink]);

  function checkAutocomplete() {
    const ta = textareaRef.current;
    if (!ta) { setOpen(false); return; }
    const cursorPos = ta.selectionStart;
    const textBefore = content.slice(0, cursorPos);
    const lastOpen = textBefore.lastIndexOf('[[');
    if (lastOpen === -1) {
      setOpen(false);
      return;
    }
    const afterOpen = textBefore.slice(lastOpen + 2);
    if (afterOpen.includes(']]') || afterOpen.includes('\n')) {
      setOpen(false);
      return;
    }
    setQuery(afterOpen);
    setActiveIndex(0);
    setOpen(true);
  }

  useEffect(() => {
    if (content) checkAutocomplete();
  }, [content]);

  useEffect(() => {
    function onSelectionChange() {
      checkAutocomplete();
    }
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [content]);

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open || filtered.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 z-50 mx-8 mt-1" style={{ top: 0 }}>
      <div
        ref={listRef}
        className="rounded-xl border border-theme-border bg-white shadow-xl overflow-hidden max-h-80 overflow-y-auto"
      >
        <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-theme-muted border-b border-theme-border bg-theme-card/50">
          Link to page{filtered.length > 1 ? 's' : ''} {query && `— "${query}"`}
        </div>
        {filtered.map((page, i) => (
          <button
            key={page.id}
            onClick={() => insertLink(page.title)}
            onMouseEnter={() => setActiveIndex(i)}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${
              i === activeIndex
                ? 'bg-fluid-50 text-fluid-700 dark:bg-fluid-900/30 dark:text-fluid-400'
                : 'text-theme-subtle hover:bg-theme-hover'
            }`}
          >
            <FileText className={`h-4 w-4 shrink-0 ${
              i === activeIndex ? 'text-fluid-500' : 'text-theme-muted'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{page.title}</div>
              {page.description && (
                <div className="text-xs text-theme-muted truncate mt-0.5">
                  {page.description}
                </div>
              )}
            </div>
            <span className="text-[10px] text-theme-muted font-mono shrink-0">
              {i === activeIndex ? '⏎ enter' : ''}
            </span>
          </button>
        ))}
        {pages.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-theme-muted">
            <Plus className="h-5 w-5 mx-auto mb-2 opacity-50" />
            No pages yet — create one from the sidebar
          </div>
        )}
      </div>
    </div>
  );
}
