'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save, Eye, Edit3, FileText, ChevronRight, Cloud, CloudOff,
  Bold, Italic, Heading1, Heading2, Link as LinkIcon, Code, List,
  ListOrdered, Quote, MoreHorizontal, Copy, Trash2, Layers,
  BookOpen, Clock, Type, AlertTriangle, Minus, Table, CheckSquare,
  MessageSquare, X, Maximize2, Minimize2, Image as ImageIcon, Code2,
} from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { ShortcutsModal } from '@/components/shortcuts';
import { GraphModalOpener } from '@/components/graph';
import { HistoryButton } from '@/components/history';
import { findBacklinks, extractTags } from '@/lib/wiki';
import { extractDescription, extractHeadings } from '@/lib/content';
import { Comments } from '@/components/comments';
import { BookmarkButton } from '@/components/bookmark-button';
import { SchedulePublish } from '@/components/schedule-publish';
import { CodeMirrorEditor, type CodeMirrorEditorRef } from '@/components/editor/codemirror-editor';
import { SlashCommandMenu, type SlashCommand } from '@/components/editor/slash-commands';
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

type ViewMode = 'edit' | 'preview' | 'split';

export function DocEditor({ project }: { project: Project }) {
  const router = useRouter();
  const editorRef = useRef<CodeMirrorEditorRef>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);

  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [pageList, setPageList] = useState<Page[]>(project.pages);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCopiedTip, setShowCopiedTip] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string | null; email: string | null; image: string | null }[]>([]);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const splitDividerRef = useRef<HTMLDivElement>(null);

  // Autosave state
  const [dirty, setDirty] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedVersionRef = useRef({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(false);

  const DRAFT_KEY = useMemo(
    () => (selectedPage ? `fluid_draft_${selectedPage.id}` : null),
    [selectedPage]
  );

  // Draft management
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
  }, [DRAFT_KEY, selectedPage]);

  useEffect(() => {
    if (!DRAFT_KEY || !selectedPage) return;
    if (dirty) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, updatedAt: Date.now() }));
      } catch { /* ignore */ }
    }
  }, [title, content, dirty, DRAFT_KEY, selectedPage]);

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

  // Team members for @mentions
  useEffect(() => {
    fetch('/api/team/members')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTeamMembers(data);
      })
      .catch(() => {});
  }, []);

  // Page list sync
  useEffect(() => {
    setPageList(project.pages);
  }, [project.pages]);

  // Breadcrumbs
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

  // Save logic
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
  }, [selectedPage?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
      fetch(`/api/pages/${selectedPage.id}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      }).catch(() => {});
    }

    setSaving(false);
    router.refresh();
  }

  // Global keyboard shortcuts — use refs to avoid re-attaching
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === 's') {
        e.preventDefault();
        handleSaveRef.current();
      }
      if (isMeta && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setViewMode((v) => v === 'edit' ? 'preview' : v === 'preview' ? 'split' : 'edit');
      }
      if (isMeta && e.key === '\\') {
        e.preventDefault();
        setZenMode((v) => !v);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside actions menu
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Split view divider drag — use ref to avoid re-attaching on each position change
  const splitPositionRef = useRef(splitPosition);
  splitPositionRef.current = splitPosition;

  useEffect(() => {
    const divider = splitDividerRef.current;
    if (!divider || viewMode !== 'split') return;

    let startX = 0;
    let startPct = 0;

    function onMouseDown(e: MouseEvent) {
      e.preventDefault();
      startX = e.clientX;
      startPct = splitPositionRef.current;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    function onMouseMove(e: MouseEvent) {
      const container = splitRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dx = e.clientX - startX;
      const pct = startPct + (dx / rect.width) * 100;
      setSplitPosition(Math.min(Math.max(pct, 25), 75));
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    divider.addEventListener('mousedown', onMouseDown);
    return () => divider.removeEventListener('mousedown', onMouseDown);
  }, [viewMode]);

  // Image upload handler
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  // Image paste handler
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (viewMode === 'preview') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            setIsDragging(true);
            uploadImage(file).then((url) => {
              if (url && editorRef.current) {
                const md = `![image](${url})`;
                editorRef.current.insertText(md);
              }
              setIsDragging(false);
            });
          }
          break;
        }
      }
    }
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [viewMode, uploadImage]);

  // Image drag-and-drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (!files.length) return;

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        setIsDragging(true);
        const url = await uploadImage(file);
        if (url && editorRef.current) {
          const md = `![${file.name}](${url})`;
          editorRef.current.insertText(md);
        }
        setIsDragging(false);
      }
    }
  }, [uploadImage]);

  // Slash commands
  const handleSlashCommand = useCallback((query: string) => {
    setSlashQuery(query);
    setShowSlashCommands(true);
    // Calculate menu position from CodeMirror cursor
    const view = editorRef.current?.view;
    if (view) {
      const coords = view.coordsAtPos(view.state.selection.main.head);
      if (coords) {
        setSlashPosition({ top: coords.bottom + 4, left: coords.left });
      }
    }
  }, []);

  const handleSlashCommandSelect = useCallback((command: SlashCommand) => {
    if (editorRef.current) {
      const view = editorRef.current.view;
      if (view) {
        const pos = view.state.selection.main.head;
        const line = view.state.doc.lineAt(pos);
        const lineText = line.text;
        const slashIndex = lineText.lastIndexOf('/');
        if (slashIndex !== -1) {
          const from = line.from + slashIndex;
          const to = pos;
          view.dispatch({
            changes: { from, to, insert: command.insert },
            selection: { anchor: from + command.insert.length },
          });
          view.focus();
        }
      }
    }
    setShowSlashCommands(false);
    setSlashQuery('');
  }, []);

  const handleSlashCommandClose = useCallback(() => {
    setShowSlashCommands(false);
    setSlashQuery('');
  }, []);

  // Formatting actions for toolbar
  const formattingActions = useMemo(() => [
    {
      icon: Heading1, label: 'Heading 1', shortcut: '', action: () => editorRef.current?.insertText('# '),
    },
    {
      icon: Heading2, label: 'Heading 2', shortcut: '', action: () => editorRef.current?.insertText('## '),
    },
    {
      icon: Bold, label: 'Bold', shortcut: '⌘B', action: () => {
        const view = editorRef.current?.view;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        const selected = view.state.sliceDoc(from, to);
        const replacement = selected ? `**${selected}**` : '**bold text**';
        view.dispatch({ changes: { from, to, insert: replacement } });
        view.focus();
      },
    },
    {
      icon: Italic, label: 'Italic', shortcut: '⌘I', action: () => {
        const view = editorRef.current?.view;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        const selected = view.state.sliceDoc(from, to);
        const replacement = selected ? `*${selected}*` : '*italic text*';
        view.dispatch({ changes: { from, to, insert: replacement } });
        view.focus();
      },
    },
    {
      icon: Code, label: 'Code', shortcut: '`', action: () => {
        const view = editorRef.current?.view;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        const selected = view.state.sliceDoc(from, to);
        const replacement = selected ? `\`${selected}\`` : '`code`';
        view.dispatch({ changes: { from, to, insert: replacement } });
        view.focus();
      },
    },
    {
      icon: LinkIcon, label: 'Link', shortcut: '⌘K', action: () => {
        const view = editorRef.current?.view;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        const selected = view.state.sliceDoc(from, to);
        const replacement = selected ? `[${selected}](url)` : '[link text](url)';
        view.dispatch({ changes: { from, to, insert: replacement } });
        view.focus();
      },
    },
    { icon: List, label: 'Bullets', shortcut: '', action: () => editorRef.current?.insertText('- ') },
    { icon: ListOrdered, label: 'Numbers', shortcut: '', action: () => editorRef.current?.insertText('1. ') },
    { icon: Quote, label: 'Quote', shortcut: '', action: () => editorRef.current?.insertText('> ') },
    { icon: CheckSquare, label: 'Task', shortcut: '', action: () => editorRef.current?.insertText('- [ ] ') },
    { icon: Code2, label: 'Code Block', shortcut: '', action: () => editorRef.current?.insertText('```javascript\n\n```') },
    { icon: Minus, label: 'Divider', shortcut: '', action: () => editorRef.current?.insertText('\n---\n') },
    { icon: Table, label: 'Table', shortcut: '', action: () => editorRef.current?.insertText('\n| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n') },
    { icon: ImageIcon, label: 'Image', shortcut: '', action: () => editorRef.current?.insertText('![alt text](url)') },
  ], []);

  // Page selection
  function selectPage(page: Page) {
    setSelectedPage(page);
    setTitle(page.title);
    setContent(page.content);
    setViewMode('edit');
  }

  // Page operations
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

  // Stats
  const wordCount = useMemo(
    () => (content.trim() ? content.trim().split(/\s+/).length : 0),
    [content],
  );
  const charCount = content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Empty states
  if (!selectedPage && pageList.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-theme-accent/10 text-theme-accent">
            <FileText className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-theme-main">Create your first page</h2>
          <p className="mt-2 text-sm text-theme-muted">
            Start documenting by creating a page from the sidebar. Use{' '}
            <kbd className="rounded-md border border-theme-border bg-theme-card px-1.5 py-0.5 text-xs font-medium text-theme-subtle">
              ⌘K
            </kbd>{' '}
            to search anytime.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-left">
            <Link href={`/dashboard/${project.id}/import`} className="rounded-xl border border-theme-border bg-theme-page p-4 transition-all hover:border-theme-accent/20 hover:shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent/10 text-theme-accent">
                <Code2 className="h-4 w-4" />
              </div>
              <p className="mt-2 text-xs font-medium text-theme-main">Import from Code</p>
              <p className="mt-1 text-xs text-theme-muted">Auto-generate from TS/JS</p>
            </Link>
            <div className="rounded-xl border border-theme-border bg-theme-page p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent/10 text-theme-accent">
                <Bold className="h-4 w-4" />
              </div>
              <p className="mt-2 text-xs font-medium text-theme-main">Rich Markdown</p>
              <p className="mt-1 text-xs text-theme-muted">Bold, tables, code, and more</p>
            </div>
            <div className="rounded-xl border border-theme-border bg-theme-page p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent/10 text-theme-accent">
                <LinkIcon className="h-4 w-4" />
              </div>
              <p className="mt-2 text-xs font-medium text-theme-main">Wiki Links</p>
              <p className="mt-1 text-xs text-theme-muted">Connect pages with [[links]]</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedPage) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-2xl space-y-6 p-8">
          <div className="rounded-2xl border border-theme-border bg-theme-card/30 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-accent/10 text-theme-accent">
              <BookOpen className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-theme-main">Welcome back</h2>
            <p className="mt-1 text-sm text-theme-muted">
              Select a page from the sidebar or create a new one.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-theme-muted">
              <span className="rounded-lg bg-theme-card border border-theme-border px-3 py-1.5 shadow-sm">
                <kbd className="font-medium text-theme-subtle">⌘K</kbd> Search
              </span>
              <span className="rounded-lg bg-theme-card border border-theme-border px-3 py-1.5 shadow-sm">
                <kbd className="font-medium text-theme-subtle">⌘S</kbd> Save
              </span>
              <span className="rounded-lg bg-theme-card border border-theme-border px-3 py-1.5 shadow-sm">
                <kbd className="font-medium text-theme-subtle">⌘⇧P</kbd> Preview
              </span>
              <span className="rounded-lg bg-theme-card border border-theme-border px-3 py-1.5 shadow-sm">
                <kbd className="font-medium text-theme-subtle">⌘\</kbd> Zen Mode
              </span>
            </div>
          </div>

          {pageList.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-theme-muted">Recent pages</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {pageList.slice(0, 6).map((page) => (
                  <button
                    key={page.id}
                    onClick={() => selectPage(page)}
                    className="flex items-start gap-3 rounded-xl border border-theme-border bg-theme-card p-4 text-left transition-all hover:border-theme-accent/20 hover:shadow-sm"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-theme-hover text-theme-muted">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-theme-main truncate">{page.title}</h3>
                      {page.description && (
                        <p className="mt-0.5 text-xs text-theme-muted line-clamp-1">{page.description}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-1 overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Main editor area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        {!zenMode && (
          <div className="border-b border-theme-border px-4 sm:px-6 py-2 shrink-0">
            {breadcrumbs.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-theme-muted mb-1 overflow-x-auto">
                {breadcrumbs.map((crumb) => (
                  <span key={crumb.id} className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/docs/${project.id}/${crumb.slug}`}
                      className="hover:text-theme-subtle transition-colors"
                    >
                      {crumb.title}
                    </Link>
                    <ChevronRight className="h-3 w-3" />
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-lg font-semibold text-theme-main outline-none placeholder:text-theme-muted"
                placeholder="Page title"
              />
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setViewMode((v) => v === 'edit' ? 'preview' : v === 'preview' ? 'split' : 'edit')}
                  className={`rounded-lg p-1.5 shrink-0 transition-colors ${
                    viewMode !== 'edit'
                      ? 'bg-theme-accent/10 text-theme-accent'
                      : 'text-theme-muted hover:bg-theme-hover hover:text-theme-subtle'
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

                <div className="relative shrink-0" ref={actionsRef}>
                  <button
                    onClick={() => setShowActions((v) => !v)}
                    className="rounded-lg p-1.5 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
                    title="Page actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {showActions && (
                    <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-theme-border bg-theme-card shadow-xl py-1">
                      <button
                        onClick={handleCopyLink}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-theme-subtle hover:bg-theme-hover transition-colors"
                      >
                        <Copy className="h-4 w-4 text-theme-muted" />
                        Copy Link
                        {showCopiedTip && <span className="ml-auto text-xs text-green-500">Copied!</span>}
                      </button>
                      <button
                        onClick={handleDuplicatePage}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-theme-subtle hover:bg-theme-hover transition-colors"
                      >
                        <Layers className="h-4 w-4 text-theme-muted" />
                        Duplicate Page
                      </button>
                      <div className="border-t border-theme-border my-1" />
                      <div className="px-4 py-2">
                        <SchedulePublish pageId={selectedPage!.id} />
                      </div>
                      <div className="border-t border-theme-border my-1" />
                      <button
                        onClick={() => { setShowDeleteConfirm(true); setShowActions(false); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Page
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowComments(!showComments)}
                  className={`rounded-lg p-1.5 shrink-0 transition-colors ${
                    showComments
                      ? 'bg-theme-accent/10 text-theme-accent'
                      : 'text-theme-muted hover:bg-theme-hover hover:text-theme-subtle'
                  }`}
                  title="Toggle discussion"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>

                {selectedPage && <BookmarkButton pageId={selectedPage.id} />}

                <button
                  onClick={() => setZenMode((v) => !v)}
                  className="rounded-lg p-1.5 shrink-0 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
                  title="Zen mode (⌘\)"
                >
                  {zenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>

                {autoSaveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-xs text-theme-muted shrink-0">
                    <Cloud className="h-3 w-3 animate-pulse" />
                    <span className="hidden sm:inline">Saving...</span>
                  </span>
                )}
                {autoSaveStatus === 'saved' && !dirty && (
                  <span className="flex items-center gap-1 text-xs text-theme-muted shrink-0">
                    <Cloud className="h-3 w-3" />
                    <span className="hidden sm:inline">Saved</span>
                  </span>
                )}
                {autoSaveStatus === 'unsaved' && (
                  <span className="flex items-center gap-1 text-xs text-amber-500 shrink-0">
                    <CloudOff className="h-3 w-3" />
                    <span className="hidden sm:inline">Unsaved</span>
                  </span>
                )}
                {dirty && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-lg bg-theme-accent px-2.5 py-1.5 text-sm font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors disabled:opacity-50 shrink-0"
                    title="Save (⌘S)"
                  >
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Draft banner */}
        {draftAvailable && (
          <div className="flex items-center justify-between bg-amber-500/10 border-b border-amber-500/20 px-6 py-2">
            <p className="text-xs text-amber-500">
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
                onClick={() => clearDraft()}
                className="rounded-lg px-3 py-1 text-xs font-medium text-amber-500 hover:bg-amber-500/10 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Formatting toolbar */}
        {viewMode !== 'preview' && !zenMode && (
          <div className="flex items-center gap-0.5 overflow-x-auto border-b border-theme-border px-3 py-1.5 sm:px-4 shrink-0">
            {formattingActions.map((btn) => (
              <button
                key={btn.label}
                onClick={btn.action}
                className="group relative shrink-0 rounded-md p-1.5 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
                title={btn.shortcut ? `${btn.label} (${btn.shortcut})` : btn.label}
              >
                <btn.icon className="h-3.5 w-3.5" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-theme-card border border-theme-border px-2 py-1 text-xs text-theme-main opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {btn.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Editor content */}
        <div
          ref={splitRef}
          className="flex flex-1 overflow-hidden relative"
        >
          {/* Drag overlay */}
          {isDragOver && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-theme-accent/5 border-2 border-dashed border-theme-accent/30 rounded-lg">
              <div className="text-center">
                <ImageIcon className="h-10 w-10 mx-auto mb-2 text-theme-accent" aria-hidden="true" />
                <p className="text-sm font-medium text-theme-accent">Drop image here</p>
                <p className="text-xs text-theme-muted mt-1">PNG, JPG, GIF, WebP up to 10MB</p>
              </div>
            </div>
          )}

          {/* Upload overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-theme-accent/5">
              <div className="flex items-center gap-2 rounded-xl bg-theme-card border border-theme-border px-4 py-3 shadow-xl">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-theme-accent border-t-transparent" />
                <span className="text-sm text-theme-main">Uploading image...</span>
              </div>
            </div>
          )}

          {viewMode === 'preview' ? (
            <div className="flex w-full">
              <div className="min-w-0 flex-1 mx-auto max-w-3xl p-4 sm:p-8">
                <h1 className="mb-6 text-2xl sm:text-3xl font-bold tracking-tight text-theme-main">{title}</h1>
                {content ? (
                  <Markdown
                    content={content}
                    projectId={project.id}
                    pages={pageList}
                    basePath={`/docs/${project.id}`}
                  />
                ) : (
                  <p className="text-theme-muted italic">No content yet</p>
                )}
              </div>
              {headings.length > 0 && (
                <aside className="hidden xl:block w-64 shrink-0 border-l border-theme-border p-4">
                  <div className="rounded-xl border border-theme-border bg-theme-card p-4 sticky top-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-theme-muted mb-3">
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
                          className="block rounded-md px-2 py-1 text-sm text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
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
            <div className="flex w-full h-full">
              <div className="relative min-w-0 h-full overflow-hidden" style={{ width: `${splitPosition}%` }}>
                <div className="relative h-full overflow-y-auto">
                  <div className="px-8 pt-6 pb-6">
                    {showSlashCommands && (
                      <SlashCommandMenu
                        open={showSlashCommands}
                        query={slashQuery}
                        position={slashPosition}
                        onSelect={handleSlashCommandSelect}
                        onClose={handleSlashCommandClose}
                      />
                    )}
                    <CodeMirrorEditor
                      ref={editorRef}
                      value={content}
                      onChange={setContent}
                      className="h-full min-h-[calc(100vh-200px)]"
                      placeholder="Write your documentation in Markdown... Type / for commands"
                      onSlashCommand={handleSlashCommand}
                      onSlashCommandClose={handleSlashCommandClose}
                    />
                  </div>
                </div>
              </div>
              <div
                ref={splitDividerRef}
                className="w-1 bg-theme-border hover:bg-theme-accent/40 cursor-col-resize shrink-0 transition-colors"
              />
              <div className="flex-1 overflow-y-auto min-w-0">
                <div className="p-4 sm:p-8">
                  <h1 className="mb-6 text-2xl sm:text-3xl font-bold tracking-tight text-theme-main">{title}</h1>
                  {content ? (
                    <Markdown
                      content={content}
                      projectId={project.id}
                      pages={pageList}
                      basePath={`/docs/${project.id}`}
                    />
                  ) : (
                    <p className="text-theme-muted italic">No content yet</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative flex-1 overflow-y-auto">
              <div className="px-8 pt-6 pb-32 max-w-4xl mx-auto">
                {showSlashCommands && (
                  <SlashCommandMenu
                    open={showSlashCommands}
                    query={slashQuery}
                    position={slashPosition}
                    onSelect={handleSlashCommandSelect}
                    onClose={handleSlashCommandClose}
                  />
                )}
                <CodeMirrorEditor
                  ref={editorRef}
                  value={content}
                  onChange={setContent}
                  className="min-h-[calc(100vh-200px)]"
                  placeholder="Start writing... Type / for commands"
                  onSlashCommand={handleSlashCommand}
                  onSlashCommandClose={handleSlashCommandClose}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        {!zenMode && (
          <div className="flex items-center justify-between border-t border-theme-border px-6 py-1.5 text-xs text-theme-muted shrink-0">
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
                      className="inline-flex items-center rounded-full bg-theme-accent/10 px-2 py-0.5 text-[10px] font-medium text-theme-accent"
                    >
                      {tag}
                    </span>
                  ))}
                  {tags.length > 3 && (
                    <span className="text-[10px] text-theme-muted">+{tags.length - 3}</span>
                  )}
                </div>
              )}
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                viewMode === 'edit' ? 'bg-theme-hover text-theme-muted' :
                viewMode === 'preview' ? 'bg-theme-accent/10 text-theme-accent' :
                'bg-theme-accent-light text-theme-accent'
              }`}>
                {viewMode === 'edit' ? 'Edit' : viewMode === 'preview' ? 'Preview' : 'Split'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Comments side panel */}
      {showComments && selectedPage && (
        <div className="w-80 shrink-0 border-l border-theme-border bg-theme-page flex flex-col">
          <div className="flex items-center justify-between border-b border-theme-border px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-theme-accent" />
              <span className="text-sm font-medium text-theme-main">Discussion</span>
            </div>
            <button
              onClick={() => setShowComments(false)}
              className="rounded p-1 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-theme-border bg-theme-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-theme-main">Delete page</h3>
                <p className="text-xs text-theme-muted">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-theme-subtle mb-6">
              Are you sure you want to delete <strong>{selectedPage?.title}</strong>?
              All content will be permanently removed.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-theme-border px-4 py-2 text-sm font-medium text-theme-subtle hover:bg-theme-hover transition-colors"
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
