'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Eye, Edit3, FileText, ChevronRight, ArrowRight, Hash, Cloud, CloudOff, Bold, Italic, Heading1, Heading2, Link as LinkIcon, Code, Code2, List, ListOrdered, Quote, MoreHorizontal, Copy, Trash2, Layers, BookOpen, Clock, Type, AlertTriangle, Minus, Table, CheckSquare, MessageSquare, X, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { ShortcutsModal } from '@/components/shortcuts';
import { GraphModalOpener } from '@/components/graph';
import { HistoryButton } from '@/components/history';
import { findBacklinks, extractTags } from '@/lib/wiki';
import { extractDescription, extractHeadings } from '@/lib/content';
import { WikiAutocomplete } from '@/components/wiki-autocomplete';
import { Comments } from '@/components/comments';
import { BookmarkButton } from '@/components/bookmark-button';
import { SchedulePublish } from '@/components/schedule-publish';
import { ExplainProject } from '@/components/explain-project';
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
  const [showComments, setShowComments] = useState(false);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string | null; email: string | null; image: string | null }[]>([]);
  const actionsRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selRef = useRef({ start: 0, end: 0 });

  function saveSelection() {
    const ta = textareaRef.current;
    if (ta) selRef.current = { start: ta.selectionStart, end: ta.selectionEnd };
  }

  function insertFormatting(before: string, after: string, fallback: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    const { start, end } = selRef.current;
    ta.setSelectionRange(start, end);
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
    { icon: Bold, label: 'Bold', shortcut: '⌘B', action: () => insertFormatting('**', '**', 'bold text') },
    { icon: Italic, label: 'Italic', shortcut: '⌘I', action: () => insertFormatting('*', '*', 'italic text') },
    { icon: Code, label: 'Code', shortcut: '`', action: () => insertFormatting('`', '`', 'code') },
    { icon: Heading1, label: 'Heading 2', action: () => insertFormatting('\n## ', '', 'Heading') },
    { icon: Heading2, label: 'Heading 3', action: () => insertFormatting('\n### ', '', 'Heading') },
    { icon: LinkIcon, label: 'Link', shortcut: '⌘K', action: () => insertFormatting('[', '](url)', 'link text') },
    { icon: List, label: 'Bullets', action: () => insertFormatting('\n- ', '', 'item') },
    { icon: ListOrdered, label: 'Numbers', action: () => insertFormatting('\n1. ', '', 'item') },
    { icon: Quote, label: 'Quote', action: () => insertFormatting('\n> ', '', 'quote') },
    { icon: Minus, label: 'Divider', action: () => insertFormatting('\n---\n', '', '') },
    { icon: Table, label: 'Table', action: () => insertFormatting('\n| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n', '', '') },
    { icon: CheckSquare, label: 'Task', action: () => insertFormatting('\n- [ ] ', '', 'task') },
  ];

  useEffect(() => {
    setPageList(project.pages);
  }, [project.pages]);

  // Fetch team members for @mentions
  useEffect(() => {
    fetch('/api/team/members')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTeamMembers(data);
        }
      })
      .catch(() => {});
  }, []);

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
      if (isMeta && e.key === 'k') {
        e.preventDefault();
        insertFormatting('[', '](url)', 'link text');
      }
      if (isMeta && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setViewMode((v) => v === 'edit' ? 'preview' : v === 'preview' ? 'split' : 'edit');
      }
      if (e.key === 'Tab' && !isMeta) {
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        if (start === end) {
          // No selection - insert tab
          const newContent = content.slice(0, start) + '  ' + content.slice(end);
          setContent(newContent);
          requestAnimationFrame(() => {
            ta.setSelectionRange(start + 2, start + 2);
          });
        } else {
          // Selection - indent/outdent lines
          const selected = content.slice(start, end);
          const lines = selected.split('\n');
          if (e.shiftKey) {
            // Outdent
            const outdented = lines.map((line) => line.replace(/^  /, '')).join('\n');
            const newContent = content.slice(0, start) + outdented + content.slice(end);
            setContent(newContent);
          } else {
            // Indent
            const indented = lines.map((line) => '  ' + line).join('\n');
            const newContent = content.slice(0, start) + indented + content.slice(end);
            setContent(newContent);
          }
        }
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

  // Empty state: no pages at all
  if (!selectedPage && pageList.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-fluid-50 text-fluid-500 dark:bg-fluid-900/30 dark:text-fluid-400">
            <FileText className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">Create your first page</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Start documenting by creating a page from the sidebar. Use{' '}
            <kbd className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              ⌘K
            </kbd>{' '}
            to search anytime.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-left">
            <Link href={`/dashboard/${project.id}/import`} className="rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-fluid-200 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fluid-50 text-fluid-600 dark:bg-fluid-900/30 dark:text-fluid-400">
                <Code2 className="h-4 w-4" />
              </div>
              <p className="mt-2 text-xs font-medium text-gray-900 dark:text-white">Import from Code</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Auto-generate from TS/JS or OpenAPI</p>
            </Link>
            <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fluid-50 text-fluid-600 dark:bg-fluid-900/30 dark:text-fluid-400">
                <Bold className="h-4 w-4" />
              </div>
              <p className="mt-2 text-xs font-medium text-gray-900 dark:text-white">Rich Markdown</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Bold, italic, code, tables, and more</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fluid-50 text-fluid-600 dark:bg-fluid-900/30 dark:text-fluid-400">
                <LinkIcon className="h-4 w-4" />
              </div>
              <p className="mt-2 text-xs font-medium text-gray-900 dark:text-white">Wiki Links</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Connect pages with [[double brackets]]</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state: pages exist but none selected
  if (!selectedPage) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-2xl space-y-6 p-8">
          <div className="rounded-2xl border border-fluid-100 bg-fluid-50/30 p-6 text-center dark:border-fluid-900/50 dark:bg-fluid-900/10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-fluid-100 text-fluid-600 dark:bg-fluid-900/30 dark:text-fluid-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select a page from the sidebar or create a new one.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-gray-400">
              <span className="rounded-lg bg-white px-3 py-1.5 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                <kbd className="font-medium text-gray-600 dark:text-gray-300">⌘K</kbd> Search
              </span>
              <span className="rounded-lg bg-white px-3 py-1.5 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                <kbd className="font-medium text-gray-600 dark:text-gray-300">⌘S</kbd> Save
              </span>
              <span className="rounded-lg bg-white px-3 py-1.5 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                <kbd className="font-medium text-gray-600 dark:text-gray-300">⌘⇧P</kbd> Preview
              </span>
            </div>
          </div>

          {pageList.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Recent pages</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {pageList.slice(0, 6).map((page) => (
                  <button
                    key={page.id}
                    onClick={() => selectPage(page)}
                    className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 text-left transition-all hover:border-fluid-200 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-fluid-800"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate dark:text-white">{page.title}</h3>
                      {page.description && (
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-1 dark:text-gray-400">{page.description}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <ExplainProject
            projectId={project.id}
            pages={pageList}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main editor area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-2 dark:border-gray-800">
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
              {breadcrumbs.map((crumb) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  <Link
                    href={`/docs/${project.id}/${crumb.slug}`}
                    className="hover:text-gray-600 transition-colors dark:hover:text-gray-300"
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
              className="flex-1 bg-transparent text-lg font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
              placeholder="Page title"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode((v) => v === 'edit' ? 'preview' : v === 'preview' ? 'split' : 'edit')}
                className={`rounded-lg p-2 transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-fluid-50 text-fluid-600 dark:bg-fluid-900/30 dark:text-fluid-400'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300'
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
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  title="Page actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {showActions && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-xl py-1 dark:border-gray-700 dark:bg-gray-900">
                    <button
                      onClick={handleCopyLink}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <Copy className="h-4 w-4 text-gray-400" />
                      Copy Link
                      {showCopiedTip && <span className="ml-auto text-xs text-green-600">Copied!</span>}
                    </button>
                    <button
                      onClick={handleDuplicatePage}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <Layers className="h-4 w-4 text-gray-400" />
                      Duplicate Page
                    </button>
                    <div className="border-t border-gray-100 my-1 dark:border-gray-800" />
                    <div className="px-4 py-2">
                      <SchedulePublish pageId={selectedPage!.id} />
                    </div>
                    <div className="border-t border-gray-100 my-1 dark:border-gray-800" />
                    <button
                      onClick={() => { setShowDeleteConfirm(true); setShowActions(false); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Page
                    </button>
                  </div>
                )}
              </div>

              {/* Comments toggle */}
              <button
                onClick={() => setShowComments(!showComments)}
                className={`rounded-lg p-2 transition-colors ${
                  showComments
                    ? 'bg-fluid-50 text-fluid-600 dark:bg-fluid-900/30 dark:text-fluid-400'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300'
                }`}
                title="Toggle discussion"
              >
                <MessageSquare className="h-4 w-4" />
              </button>

              {selectedPage && <BookmarkButton pageId={selectedPage.id} />}

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
                  <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50 dark:bg-fluid-600 dark:hover:bg-fluid-700"
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

        {/* Draft banner */}
        {draftAvailable && (
          <div className="flex items-center justify-between bg-amber-50 border-b border-amber-200 px-6 py-2 dark:bg-amber-900/20 dark:border-amber-800/50">
            <p className="text-xs text-amber-800 dark:text-amber-300">
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
                className="rounded-lg px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors dark:text-amber-400 dark:hover:bg-amber-900/30"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Formatting toolbar */}
        {viewMode !== 'preview' && (
          <div className="flex items-center gap-0.5 border-b border-gray-100 px-4 py-1.5 dark:border-gray-800">
            {formattingActions.map((btn) => (
              <button
                key={btn.label}
                onClick={btn.action}
                className="group relative rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-300"
                title={btn.shortcut ? `${btn.label} (${btn.shortcut})` : btn.label}
              >
                <btn.icon className="h-3.5 w-3.5" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity dark:bg-gray-700 pointer-events-none">
                  {btn.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Editor content */}
        <div className="flex flex-1 overflow-y-auto">
          {viewMode === 'preview' ? (
            <div className="flex w-full">
              <div className="min-w-0 flex-1 mx-auto max-w-3xl p-8">
                <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
                {content ? (
                  <Markdown
                    content={content}
                    projectId={project.id}
                    pages={pageList}
                    basePath={`/docs/${project.id}`}
                  />
                ) : (
                  <p className="text-gray-400 italic dark:text-gray-500">No content yet</p>
                )}
              </div>
              {headings.length > 0 && (
                <aside className="hidden xl:block w-64 shrink-0 border-l border-gray-100 p-4 dark:border-gray-800">
                  <div className="rounded-xl border border-gray-100 bg-white p-4 sticky top-4 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 mb-3 dark:text-gray-500">
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
                          className="block rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
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
            <div className="flex w-full divide-x divide-gray-100 dark:divide-gray-800">
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
                  onSelect={saveSelection}
                  onClick={saveSelection}
                  onKeyUp={saveSelection}
                  className="h-full w-full resize-none bg-transparent p-8 font-mono text-sm leading-relaxed text-gray-800 outline-none placeholder:text-gray-300 dark:text-gray-200 dark:placeholder:text-gray-600"
                  placeholder="Write your documentation in Markdown..."
                  spellCheck={false}
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                  <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
                  {content ? (
                    <Markdown
                      content={content}
                      projectId={project.id}
                      pages={pageList}
                      basePath={`/docs/${project.id}`}
                    />
                  ) : (
                    <p className="text-gray-400 italic dark:text-gray-500">No content yet</p>
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
                onSelect={saveSelection}
                onClick={saveSelection}
                onKeyUp={saveSelection}
                className="h-full w-full resize-none bg-transparent p-8 font-mono text-sm leading-relaxed text-gray-800 outline-none placeholder:text-gray-300 dark:text-gray-200 dark:placeholder:text-gray-600"
                placeholder="Start writing..."
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-1.5 text-xs text-gray-400 dark:border-gray-800">
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
            {tags.length > 0 && (
              <div className="flex items-center gap-1">
                {tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-fluid-50 px-2 py-0.5 text-[10px] font-medium text-fluid-700 dark:bg-fluid-900/30 dark:text-fluid-400"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span className="text-[10px] text-gray-400">+{tags.length - 3}</span>
                )}
              </div>
            )}
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              viewMode === 'edit' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' :
              viewMode === 'preview' ? 'bg-fluid-50 text-fluid-600 dark:bg-fluid-900/30 dark:text-fluid-400' :
              'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
            }`}>
              {viewMode === 'edit' ? 'Edit' : viewMode === 'preview' ? 'Preview' : 'Split'}
            </span>
          </div>
        </div>
      </div>

      {/* Comments side panel */}
      {showComments && selectedPage && (
        <div className="w-80 shrink-0 border-l border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-fluid-600 dark:text-fluid-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Discussion</span>
            </div>
            <button
              onClick={() => setShowComments(false)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Comments pageId={selectedPage.id} teamMembers={teamMembers} />
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Delete page</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6 dark:text-gray-400">
              Are you sure you want to delete <strong>{selectedPage?.title}</strong>?
              All content will be permanently removed.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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
    </div>
  );
}
