'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Eye, Edit3, FileText, ChevronRight, ArrowRight, Hash, Cloud, CloudOff, Bold, Italic, Heading1, Heading2, Link as LinkIcon, Code, List, ListOrdered, Quote, MoreHorizontal, Copy, Trash2, Layers, BookOpen, Clock, Type, AlertTriangle, ListOrdered as ListOrderedIcon } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { ShortcutsModal } from '@/components/shortcuts';
import { GraphModalOpener } from '@/components/graph';
import { HistoryButton } from '@/components/history';
import { findBacklinks, extractTags } from '@/lib/wiki';
import { extractDescription, extractHeadings } from '@/lib/content';
import { WikiAutocomplete } from '@/components/wiki-autocomplete';
import Link from 'next/link';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  description: string | null;
  order: number;
  parentId: string | null;
}

interface Project {
  id: string;
  name: string;
  pages: Page[];
}

export function DocEditor({ project }: { project: Project }) {
  const router = useRouter();
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [pageList, setPageList] = useState<Page[]>(project.pages);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCopiedTip, setShowCopiedTip] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertFormatting(before: string, after: string, fallback: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const insertion = selected ? `${before}${selected}${after}` : `${before}${fallback}${after}`;
    const newContent = content.slice(0, start) + insertion + content.slice(end);
    setContent(newContent);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + insertion.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  const formattingActions = [
    { icon: Bold, label: 'Bold', action: () => insertFormatting('**', '**', 'bold text') },
    { icon: Italic, label: 'Italic', action: () => insertFormatting('*', '*', 'italic text') },
    { icon: Heading1, label: 'Heading 2', action: () => insertFormatting('\n## ', '', 'Heading') },
    { icon: Heading2, label: 'Heading 3', action: () => insertFormatting('\n### ', '', 'Heading') },
    { icon: LinkIcon, label: 'Link', action: () => insertFormatting('[', '](url)', 'link text') },
    { icon: Code, label: 'Inline Code', action: () => insertFormatting('`', '`', 'code') },
    { icon: List, label: 'Bullet List', action: () => insertFormatting('\n- ', '', 'item') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertFormatting('\n1. ', '', 'item') },
    { icon: Quote, label: 'Blockquote', action: () => insertFormatting('\n> ', '', 'quote') },
  ];

  useEffect(() => {
    setPageList(project.pages);
  }, [project.pages]);

  const breadcrumbs = useMemo(() => {
    if (!selectedPage) return [];
    const crumbs: Page[] = [];
    let current = selectedPage;
    let safety = 0;
    while (current.parentId && safety < 10) {
      const parent = pageList.find((p) => p.id === current.parentId);
      if (!parent) break;
      crumbs.unshift(parent);
      current = parent;
      safety++;
    }
    return crumbs;
  }, [selectedPage, pageList]);

  const backlinks = useMemo(
    () => (selectedPage ? findBacklinks(selectedPage.title, pageList) : []),
    [selectedPage, pageList]
  );

  const tags = useMemo(
    () => (selectedPage ? extractTags(selectedPage.content) : []),
    [selectedPage]
  );

  const headings = useMemo(
    () => (selectedPage ? extractHeadings(selectedPage.content) : []),
    [selectedPage]
  );

  const [dirty, setDirty] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedVersionRef = useRef({ title: '', content: '' });
  const [draftAvailable, setDraftAvailable] = useState(false);

  const DRAFT_KEY = useMemo(
    () => (selectedPage ? `fluid_draft_${selectedPage.id}` : null),
    [selectedPage]
  );

  // Restore draft from localStorage
  useEffect(() => {
    if (!DRAFT_KEY) return;
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && parsed.content !== selectedPage?.content) {
          setDraftAvailable(true);
        }
      }
    } catch { /* ignore */ }
  }, [DRAFT_KEY]);

  // Save draft to localStorage on content change
  useEffect(() => {
    if (!DRAFT_KEY || !selectedPage) return;
    if (dirty) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, updatedAt: Date.now() }));
      } catch { /* ignore */ }
    }
  }, [title, content, dirty, DRAFT_KEY, selectedPage]);

  // Clear draft on save
  const clearDraft = useCallback(() => {
    if (DRAFT_KEY) {
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      setDraftAvailable(false);
    }
  }, [DRAFT_KEY]);

  function restoreDraft() {
    if (!DRAFT_KEY) return;
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        setTitle(parsed.title || title);
        setContent(parsed.content || content);
        setDraftAvailable(false);
      }
    } catch { /* ignore */ }
  }

  function discardDraft() {
    clearDraft();
  }

  const doSave = useCallback(async (t: string, c: string) => {
    if (!selectedPage) return;
    setAutoSaveStatus('saving');
    const description = extractDescription(c);
    const res = await fetch(`/api/pages/${selectedPage.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: t, content: c, description }),
    });
    if (res.ok) {
      savedVersionRef.current = { title: t, content: c };
      setAutoSaveStatus('saved');
      setDirty(false);
      setPageList((prev) =>
        prev.map((p) => (p.id === selectedPage.id ? { ...p, title: t, content: c } : p)),
      );
    } else {
      setAutoSaveStatus('unsaved');
    }
  }, [selectedPage]);

  useEffect(() => {
    if (!selectedPage) return;
    savedVersionRef.current = { title: selectedPage.title, content: selectedPage.content };
    setAutoSaveStatus('saved');
    setDirty(false);
  }, [selectedPage?.id]);

  useEffect(() => {
    if (!selectedPage) return;
    const saved = savedVersionRef.current;
    const isDirty = title !== saved.title || content !== saved.content;
    setDirty(isDirty);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    if (isDirty) {
      setAutoSaveStatus('unsaved');
      saveTimerRef.current = setTimeout(() => {
        doSave(title, content);
      }, 2000);
    }

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [title, content, selectedPage, doSave]);

  async function handleSave() {
    if (!selectedPage) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaving(true);

    const res = await fetch(`/api/pages/${selectedPage.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });

    if (res.ok) {
      savedVersionRef.current = { title, content };
      setAutoSaveStatus('saved');
      setDirty(false);
      clearDraft();
      setPageList((prev) =>
        prev.map((p) => (p.id === selectedPage.id ? { ...p, title, content } : p)),
      );
      // Create a snapshot in the background
      fetch(`/api/pages/${selectedPage.id}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      }).catch(() => {});
    }

    setSaving(false);
    router.refresh();
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (isMeta && e.key === 'b') {
        e.preventDefault();
        insertFormatting('**', '**', 'bold text');
      }
      if (isMeta && e.key === 'i') {
        e.preventDefault();
        insertFormatting('*', '*', 'italic text');
      }
      if (isMeta && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setViewMode((v) => v === 'edit' ? 'preview' : v === 'preview' ? 'split' : 'edit');
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [title, content, selectedPage]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleDuplicatePage() {
    if (!selectedPage) return;
    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${selectedPage.title} (copy)`,
        content: selectedPage.content,
        projectId: project.id,
        parentId: selectedPage.parentId,
      }),
    });
    if (res.ok) {
      const newPage = await res.json();
      setPageList((prev) => [...prev, newPage]);
      setShowActions(false);
      selectPage(newPage);
    }
  }

  async function handleDeletePage() {
    if (!selectedPage) return;
    setDeleting(true);
    const res = await fetch(`/api/pages/${selectedPage.id}`, { method: 'DELETE' });
    if (res.ok) {
      setPageList((prev) => prev.filter((p) => p.id !== selectedPage.id));
      setSelectedPage(null);
      setShowDeleteConfirm(false);
      setShowActions(false);
      router.refresh();
    }
    setDeleting(false);
  }

  async function handleCopyLink() {
    if (!selectedPage) return;
    const url = `${window.location.origin}/docs/${project.id}/${selectedPage.slug}`;
    await navigator.clipboard.writeText(url);
    setShowCopiedTip(true);
    setTimeout(() => setShowCopiedTip(false), 2000);
  }

  const wordCount = useMemo(
    () => (content.trim() ? content.trim().split(/\s+/).length : 0),
    [content],
  );
  const charCount = content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  function selectPage(page: Page) {
    setSelectedPage(page);
    setTitle(page.title);
    setContent(page.content);
    setViewMode('edit');
  }

  if (!selectedPage && pageList.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">No pages yet</h2>
          <p className="mt-2 text-sm text-gray-500">
            Create a page from the sidebar or import code to auto-generate docs.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedPage) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-2xl space-y-6 p-8">
          <div className="rounded-2xl border border-fluid-100 bg-fluid-50/30 p-6 text-center">
            <FileText className="mx-auto h-8 w-8 text-fluid-300" />
            <h2 className="mt-3 text-lg font-semibold text-gray-900">Welcome to your docs</h2>
            <p className="mt-1 text-sm text-gray-500">
              Select an existing page or create a new one to get started.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-gray-400">
              <span className="rounded-lg bg-white px-3 py-1.5 shadow-sm border border-gray-100">
                <kbd className="font-medium text-gray-600">⌘K</kbd> Search
              </span>
              <span className="rounded-lg bg-white px-3 py-1.5 shadow-sm border border-gray-100">
                <kbd className="font-medium text-gray-600">⌘S</kbd> Save
              </span>
              <span className="rounded-lg bg-white px-3 py-1.5 shadow-sm border border-gray-100">
                <kbd className="font-medium text-gray-600">⌘B</kbd> Bold
              </span>
              <span className="rounded-lg bg-white px-3 py-1.5 shadow-sm border border-gray-100">
                <kbd className="font-medium text-gray-600">⌘I</kbd> Italic
              </span>
              <span className="rounded-lg bg-white px-3 py-1.5 shadow-sm border border-gray-100">
                <kbd className="font-medium text-gray-600">⌘⇧P</kbd> Split preview
              </span>
            </div>
          </div>

          {pageList.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Pages</p>
              {pageList.map((page) => (
                <button
                  key={page.id}
                  onClick={() => selectPage(page)}
                  className="w-full rounded-xl border border-gray-100 bg-white p-4 text-left transition-all hover:border-fluid-200 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{page.title}</h3>
                    <FileText className="h-4 w-4 text-gray-300" />
                  </div>
                  {page.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-1">{page.description}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-gray-100 px-6 py-2">
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            {breadcrumbs.map((crumb) => (
              <span key={crumb.id} className="flex items-center gap-1">
                <Link
                  href={`/docs/${project.id}/${crumb.slug}`}
                  className="hover:text-gray-600 transition-colors"
                >
                  {crumb.title}
                </Link>
                <ChevronRight className="h-3 w-3" />
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent text-lg font-semibold text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="Page title"
          />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode((v) => v === 'edit' ? 'preview' : v === 'preview' ? 'split' : 'edit')}
            className={`rounded-lg p-2 transition-colors ${
              viewMode === 'preview'
                ? 'bg-fluid-50 text-fluid-600'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
            title={`${viewMode === 'edit' ? 'Preview' : viewMode === 'preview' ? 'Split view' : 'Edit'} (⌘⇧P)`}
          >
            {viewMode === 'edit' ? <Eye className="h-4 w-4" /> : viewMode === 'preview' ? <Edit3 className="h-4 w-4" /> : (
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="18" rx="2" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
            )}
          </button>
          {selectedPage && (
            <GraphModalOpener
              projectId={project.id}
              pages={pageList}
              currentPageId={selectedPage.id}
            />
          )}
          {selectedPage && <HistoryButton pageId={selectedPage.id} />}
          <ShortcutsModal />

          <div className="relative" ref={actionsRef}>
            <button
              onClick={() => setShowActions((v) => !v)}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Page actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {showActions && (
              <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-gray-200 bg-white shadow-xl py-1">
                <button
                  onClick={handleCopyLink}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="h-4 w-4 text-gray-400" />
                  Copy Link
                  {showCopiedTip && <span className="ml-auto text-xs text-green-600">Copied!</span>}
                </button>
                <button
                  onClick={handleDuplicatePage}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Layers className="h-4 w-4 text-gray-400" />
                  Duplicate Page
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { setShowDeleteConfirm(true); setShowActions(false); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Page
                </button>
              </div>
            )}
          </div>

          {autoSaveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Cloud className="h-3 w-3 animate-pulse" />
              Saving...
            </span>
          )}
          {autoSaveStatus === 'saved' && !dirty && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Cloud className="h-3 w-3" />
              Saved
            </span>
          )}
          {autoSaveStatus === 'unsaved' && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <CloudOff className="h-3 w-3" />
              Unsaved
            </span>
          )}
          {dirty && (
            <>
              <span className="text-xs text-gray-300">|</span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                title="Save (⌘S)"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
          </div>
          </div>
        </div>
        {draftAvailable && (
          <div className="flex items-center justify-between bg-amber-50 border-b border-amber-200 px-6 py-2">
            <p className="text-xs text-amber-800">
              <strong>Unsaved draft found</strong> — you have unsaved changes from a previous session.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={restoreDraft}
                className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
              >
                Restore
              </button>
              <button
                onClick={discardDraft}
                className="rounded-lg px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}

      {viewMode !== 'preview' && (
        <div className="flex items-center gap-0.5 border-b border-gray-100 px-4 py-1.5">
          {formattingActions.map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title={btn.label}
            >
              <btn.icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-1 overflow-y-auto">
        {viewMode === 'preview' ? (
          <div className="flex w-full">
            <div className="min-w-0 flex-1 mx-auto max-w-3xl p-8">
              <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
              {content ? (
                <Markdown
                  content={content}
                  projectId={project.id}
                  pages={pageList}
                  basePath={`/docs/${project.id}`}
                />
              ) : (
                <p className="text-gray-400 italic">No content yet</p>
              )}
            </div>
            {headings.length > 0 && (
              <aside className="hidden xl:block w-64 shrink-0 border-l border-gray-100 p-4">
                <div className="rounded-xl border border-gray-100 bg-white p-4 sticky top-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
                    <ListOrdered className="h-3 w-3" />
                    On this page
                  </div>
                  <nav className="space-y-0.5">
                    {headings.map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(h.id);
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="block rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                        style={{ paddingLeft: `${8 + (h.level - 1) * 12}px` }}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}
          </div>
        ) : viewMode === 'split' ? (
          <div className="flex w-full divide-x divide-gray-100">
            <div className="relative flex-1 overflow-y-auto">
              <WikiAutocomplete
                textareaRef={textareaRef}
                content={content}
                setContent={setContent}
                pages={pageList}
              />
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-full w-full resize-none bg-transparent p-8 font-mono text-sm leading-relaxed text-gray-800 outline-none placeholder:text-gray-300"
                placeholder="Write your documentation in Markdown..."
                spellCheck={false}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-8">
                <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
                {content ? (
                  <Markdown
                    content={content}
                    projectId={project.id}
                    pages={pageList}
                    basePath={`/docs/${project.id}`}
                  />
                ) : (
                  <p className="text-gray-400 italic">No content yet</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex-1">
            <WikiAutocomplete
              textareaRef={textareaRef}
              content={content}
              setContent={setContent}
              pages={pageList}
            />
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-full w-full resize-none bg-transparent p-8 font-mono text-sm leading-relaxed text-gray-800 outline-none placeholder:text-gray-300"
              placeholder="Write your documentation in Markdown..."
              spellCheck={false}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-gray-100 px-6 py-1.5 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Type className="h-3 w-3" />
            {charCount} {charCount === 1 ? 'char' : 'chars'}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {readingTime} min read
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            viewMode === 'edit' ? 'bg-gray-100 text-gray-500' :
            viewMode === 'preview' ? 'bg-fluid-50 text-fluid-600' :
            'bg-purple-50 text-purple-600'
          }`}>
            {viewMode === 'edit' ? 'Edit' : viewMode === 'preview' ? 'Preview' : 'Split'}
          </span>
          <span className="text-[10px] text-gray-300">Markdown</span>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Delete page</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedPage?.title}</strong>?
              All content will be permanently removed.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePage}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4">
        <div className="mx-auto flex max-w-3xl gap-8">
          {(tags.length > 0 || backlinks.length > 0 || selectedPage) && (
            <>
              {tags.length > 0 && (
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
                    <Hash className="h-3 w-3" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-fluid-50 px-2.5 py-0.5 text-xs font-medium text-fluid-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {backlinks.length > 0 && (
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
                    <ArrowRight className="h-3 w-3" />
                    Backlinks
                  </div>
                  <div className="space-y-1">
                    {backlinks.map((bl) => (
                      <Link
                        key={bl.slug}
                        href={`/docs/${project.id}/${bl.slug}`}
                        className="block rounded-lg px-2 py-1 text-sm text-fluid-600 hover:bg-fluid-50 hover:text-fluid-700 transition-colors"
                      >
                        {bl.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
