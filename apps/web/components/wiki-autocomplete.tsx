'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Hash, Plus } from 'lucide-react';

interface WikiAutocompleteProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  content: string;
  setContent: (val: string) => void;
  pages: { id: string; title: string; slug: string }[];
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
    .filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

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

  if (!open || filtered.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 z-50 mx-8 mt-1" style={{ top: 0 }}>
      <div
        ref={listRef}
        className="rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden max-h-64 overflow-y-auto"
      >
        <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400 border-b border-gray-50 bg-gray-50/50">
          Link to page{filtered.length > 1 ? 's' : ''}
        </div>
        {filtered.map((page, i) => (
          <button
            key={page.id}
            onClick={() => insertLink(page.title)}
            onMouseEnter={() => setActiveIndex(i)}
            className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
              i === activeIndex
                ? 'bg-fluid-50 text-fluid-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Hash className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate">{page.title}</span>
            <span className="ml-auto text-[10px] text-gray-400 font-mono">
              {i === activeIndex ? '⏎' : ''}
            </span>
          </button>
        ))}
        {pages.length === 0 && (
          <div className="px-3 py-4 text-center text-xs text-gray-400">
            <Plus className="h-4 w-4 mx-auto mb-1 opacity-50" />
            Create pages first from the sidebar
          </div>
        )}
      </div>
    </div>
  );
}
