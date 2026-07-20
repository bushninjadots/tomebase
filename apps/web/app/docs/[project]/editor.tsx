'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save, Eye, Edit3, FileText, ChevronRight, Cloud, CloudOff,
  Copy, Trash2, Layers, BookOpen, Clock, Type, AlertTriangle,
  X, Maximize2, Minimize2, Users, ListOrdered, MessageSquare,
  MoreHorizontal, Search, SplitSquareHorizontal, Image as ImageIcon,
  Menu, Sparkles, Globe,
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
import { EditorToolbar } from '@/components/editor/toolbar';
import { AIPanel } from '@/components/editor/ai-panel';
import { InlineAIResult } from '@/components/editor/inline-ai-result';
import { DocumentOutline } from '@/components/editor/document-outline';
import { TeamPresence } from '@/components/editor/team-presence';
import { PublishDialog } from '@/components/publish';
import Link from 'next/link';
import { eventBus } from '@/lib/events';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  description: string | null;
  order: number;
  parentId: string | null;
  published: boolean;
}

interface Project {
  id: string;
  name: string;
  pages: Page[];
}

type ViewMode = 'edit' | 'preview' | 'split';
type SidebarTab = 'outline' | 'team' | 'comments';

export function DocEditor({ project, initialLine, initialPageSlug }: {
  project: Project;
  initialLine?: number;
  initialPageSlug?: string;
}) {
  const router = useRouter();
  const editorRef = useRef<CodeMirrorEditorRef>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const splitDividerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Core state
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [pageList, setPageList] = useState<Page[]>(project.pages);
  const [pagePublished, setPagePublished] = useState(false);

  // UI state
  const [zenMode, setZenMode] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  // Overlays
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });

  // Link dialog
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Inline AI result
  const [inlineAIAction, setInlineAIAction] = useState<'improve' | 'rewrite' | null>(null);
  const [inlineAISelectedText, setInlineAISelectedText] = useState('');
  const linkSelectionRef = useRef<{ from: number; to: number }>({ from: 0, to: 0 });

  // Autosave
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const [saving, setSaving] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedVersionRef = useRef({ title: '', content: '' });

  // Cursor position
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Team
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string | null; email: string | null; image: string | null }[]>([]);

  // Split view
  const [splitPosition, setSplitPosition] = useState(50);
  const splitPositionRef = useRef(splitPosition);
  splitPositionRef.current = splitPosition;

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
        if (parsed && parsed.content !== selectedPage?.content) setDraftAvailable(true);
      }
    } catch { /* ignore */ }
  }, [DRAFT_KEY, selectedPage]);

  useEffect(() => {
    if (!DRAFT_KEY || !selectedPage) return;
    try {
      const saved = savedVersionRef.current;
      const isDirty = title !== saved.title || content !== saved.content;
      if (isDirty) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, updatedAt: Date.now() }));
      }
    } catch { /* ignore */ }
  }, [title, content, DRAFT_KEY, selectedPage]);

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

  // Team members
  useEffect(() => {
    fetch('/api/team/members')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setTeamMembers(data); })
      .catch(() => {});
  }, []);

  // Page list sync
  useEffect(() => { setPageList(project.pages); }, [project.pages]);

  // Handle initial page + line jump from URL params (e.g. from diagnostics)
  const hasJumpedRef = useRef(false);
  useEffect(() => {
    if (hasJumpedRef.current) return;
    if (!initialPageSlug || pageList.length === 0) return;

    const targetPage = pageList.find((p) => p.slug === initialPageSlug);
    if (targetPage) {
      hasJumpedRef.current = true;
      selectPage(targetPage);
      if (initialLine) {
        setTimeout(() => editorRef.current?.scrollToLine(initialLine), 300);
      }
    }
  }, [initialPageSlug, initialLine, pageList]);

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

  const headings = useMemo(
    () => (selectedPage ? extractHeadings(selectedPage.content) : []),
    [selectedPage]
  );

  // Active heading for outline sync
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  const tags = useMemo(
    () => (selectedPage ? extractTags(selectedPage.content) : []),
    [selectedPage]
  );

  // Active heading observer for outline sync
  useEffect(() => {
    if (!selectedPage) return;
    const headingIds = headings.map((h) => h.id);
    if (headingIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    // Small delay to let DOM render
    const timer = setTimeout(() => {
      for (const id of headingIds) {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [selectedPage?.id, headings]);

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
      setPageList((prev) => prev.map((p) => (p.id === selectedPage.id ? { ...p, title: t, content: c } : p)));
      eventBus.emit('document:saved', { pageId: selectedPage.id, content: c, snapshotId: '' });
    } else {
      setAutoSaveStatus('unsaved');
    }
  }, [selectedPage]);

  useEffect(() => {
    if (!selectedPage) return;
    savedVersionRef.current = { title: selectedPage.title, content: selectedPage.content };
    setAutoSaveStatus('saved');
  }, [selectedPage?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedPage) return;
    const saved = savedVersionRef.current;
    const isDirty = title !== saved.title || content !== saved.content;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    if (isDirty) {
      setAutoSaveStatus('unsaved');
      saveTimerRef.current = setTimeout(() => doSave(title, content), 2000);
    }

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [title, content, selectedPage, doSave]);

  const handleSaveRef = useRef(async () => {});
  handleSaveRef.current = async () => {
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
      clearDraft();
      setPageList((prev) => prev.map((p) => (p.id === selectedPage.id ? { ...p, title, content } : p)));
      fetch(`/api/pages/${selectedPage.id}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      }).catch(() => {});
      eventBus.emit('document:saved', { pageId: selectedPage.id, content, snapshotId: '' });
    }
    setSaving(false);
    router.refresh();
  };

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === 's') { e.preventDefault(); handleSaveRef.current(); }
      if (isMeta && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setViewMode((v) => v === 'edit' ? 'preview' : v === 'preview' ? 'split' : 'edit');
      }
      if (isMeta && e.key === '\\') {
        e.preventDefault();
        setZenMode((v) => !v);
      }
      if (isMeta && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setTypewriterMode((v) => !v);
      }
      if (isMeta && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAIPanel((v) => !v);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) setShowActions(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Split view drag
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
      const pct = startPct + ((e.clientX - startX) / rect.width) * 100;
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

  // Image upload
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

  // Image paste
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
            setIsUploading(true);
            uploadImage(file).then((url) => {
              if (url && editorRef.current) editorRef.current.insertText(`![image](${url})`);
              setIsUploading(false);
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
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    for (const file of e.dataTransfer.files) {
      if (file.type.startsWith('image/')) {
        setIsUploading(true);
        const url = await uploadImage(file);
        if (url && editorRef.current) editorRef.current.insertText(`![${file.name}](${url})`);
        setIsUploading(false);
      }
    }
  }, [uploadImage]);

  // Slash commands
  const handleSlashCommand = useCallback((query: string) => {
    setSlashQuery(query);
    setShowSlashCommands(true);
    const view = editorRef.current?.view;
    if (view) {
      const coords = view.coordsAtPos(view.state.selection.main.head);
      if (coords) setSlashPosition({ top: coords.bottom + 4, left: coords.left });
    }
  }, []);

  const handleSlashCommandSelect = useCallback((command: SlashCommand) => {
    if (editorRef.current) {
      const view = editorRef.current.view;
      if (view) {
        const pos = view.state.selection.main.head;
        const line = view.state.doc.lineAt(pos);
        const slashIndex = line.text.lastIndexOf('/');
        if (slashIndex !== -1) {
          const from = line.from + slashIndex;
          view.dispatch({
            changes: { from, to: pos, insert: command.insert },
            selection: { anchor: from + command.insert.length },
          });
          view.focus();
        }
      }
    }
    setShowSlashCommands(false);
    setSlashQuery('');
  }, []);

  // Page operations
  function selectPage(page: Page) {
    setSelectedPage(page);
    setTitle(page.title);
    setContent(page.content);
    setPagePublished(page.published);
    setViewMode('edit');
  }

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
    const res = await fetch(`/api/pages/${selectedPage.id}`, { method: 'DELETE' });
    if (res.ok) {
      setPageList((prev) => prev.filter((p) => p.id !== selectedPage.id));
      setSelectedPage(null);
      setShowDeleteConfirm(false);
      router.refresh();
    }
  }

  async function handleCopyLink() {
    if (!selectedPage) return;
    const url = `${window.location.origin}/docs/${project.id}/${selectedPage.slug}`;
    await navigator.clipboard.writeText(url);
    setShowActions(false);
  }

  // Stats
  const wordCount = useMemo(() => content.trim() ? content.trim().split(/\s+/).length : 0, [content]);
  const charCount = content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Toolbar action handler
  const handleToolbarAction = useCallback((action: string) => {
    const view = editorRef.current?.view;

    // AI actions — handled via state
    if (action === 'ai-chat') {
      setShowAIPanel(true);
      return;
    }
    if (action === 'ai-improve' || action === 'ai-rewrite') {
      const from = view?.state.selection.main.from ?? 0;
      const to = view?.state.selection.main.to ?? 0;
      const selected = view ? view.state.sliceDoc(from, to) : '';
      setInlineAISelectedText(selected);
      setInlineAIAction(action === 'ai-improve' ? 'improve' : 'rewrite');
      return;
    }

    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);

    const wrap = (prefix: string, suffix: string) => {
      const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}text${suffix}`;
      view.dispatch({ changes: { from, to, insert: replacement } });
      view.focus();
    };

    const insert = (text: string) => {
      view.dispatch({ changes: { from: view.state.selection.main.head, insert: text } });
      view.focus();
    };

    switch (action) {
      case 'bold': wrap('**', '**'); break;
      case 'italic': wrap('*', '*'); break;
      case 'strikethrough': wrap('~~', '~~'); break;
      case 'code': wrap('`', '`'); break;
      case 'link': {
        const { from, to } = view.state.selection.main;
        const sel = view.state.sliceDoc(from, to);
        linkSelectionRef.current = { from, to };
        setLinkText(sel || '');
        setLinkUrl('');
        setShowLinkDialog(true);
        break;
      }
      case 'h1': insert('# '); break;
      case 'h2': insert('## '); break;
      case 'h3': insert('### '); break;
      case 'bullet-list': insert('- '); break;
      case 'numbered-list': insert('1. '); break;
      case 'task-list': insert('- [ ] '); break;
      case 'blockquote': insert('> '); break;
      case 'code-block': insert('```javascript\n\n```'); break;
      case 'divider': insert('\n---\n'); break;
      case 'mermaid': insert('```mermaid\ngraph TD\n    A[Start] --> B[End]\n```'); break;
      case 'table': insert('\n| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n'); break;
      case 'callout': insert('> [!NOTE]\n> '); break;
      case 'image': imageInputRef.current?.click(); break;
      case 'columns': insert('\n| Left | Right |\n|------|-------|\n|      |       |\n'); break;
      case 'undo': editorRef.current?.undo(); break;
      case 'redo': editorRef.current?.redo(); break;
    }
  }, []);

  const isDirty = selectedPage && (title !== savedVersionRef.current.title || content !== savedVersionRef.current.content);

  // ===== EMPTY STATES =====
  if (!selectedPage && pageList.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-theme-accent/20 to-theme-accent/5 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-7 h-7 text-theme-accent" />
          </div>
          <h2 className="text-xl font-semibold text-theme-main">Create your first page</h2>
          <p className="mt-2 text-sm text-theme-muted leading-relaxed">
            Start writing documentation. Press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-theme-hover border border-theme-border text-[11px] font-mono">/</kbd>
            {' '}for quick formatting commands.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <Link
              href={`/dashboard/${project.id}/import`}
              className="group rounded-xl border border-theme-border bg-theme-card p-4 transition-all duration-200 hover:border-theme-accent/30 hover:shadow-sm hover:shadow-theme-accent/5"
            >
              <div className="w-8 h-8 rounded-lg bg-theme-accent/10 flex items-center justify-center mb-3 group-hover:bg-theme-accent/15 transition-colors">
                <Search className="w-4 h-4 text-theme-accent" />
              </div>
              <p className="text-xs font-medium text-theme-main">Import Code</p>
              <p className="text-[11px] text-theme-muted mt-0.5">Auto-generate docs</p>
            </Link>
            <div className="rounded-xl border border-theme-border bg-theme-card p-4">
              <div className="w-8 h-8 rounded-lg bg-theme-accent/10 flex items-center justify-center mb-3">
                <Type className="w-4 h-4 text-theme-accent" />
              </div>
              <p className="text-xs font-medium text-theme-main">Rich Markdown</p>
              <p className="text-[11px] text-theme-muted mt-0.5">Bold, tables, code</p>
            </div>
            <div className="rounded-xl border border-theme-border bg-theme-card p-4">
              <div className="w-8 h-8 rounded-lg bg-theme-accent/10 flex items-center justify-center mb-3">
                <MessageSquare className="w-4 h-4 text-theme-accent" />
              </div>
              <p className="text-xs font-medium text-theme-main">Wiki Links</p>
              <p className="text-[11px] text-theme-muted mt-0.5">Connect pages</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedPage) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-theme-accent/15 to-theme-accent/5 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-5 h-5 text-theme-accent" />
            </div>
            <h2 className="text-lg font-semibold text-theme-main">Welcome back</h2>
            <p className="mt-1 text-sm text-theme-muted">Select a page from the sidebar to start editing.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {[
                { keys: '⌘K', label: 'Search' },
                { keys: '⌘S', label: 'Save' },
                { keys: '⌘⇧P', label: 'Preview' },
              ].map((s) => (
                <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-theme-muted">
                  <kbd className="px-1.5 py-0.5 rounded bg-theme-hover border border-theme-border text-[10px] font-mono">{s.keys}</kbd>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
          {pageList.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-theme-muted px-1">Recent pages</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {pageList.slice(0, 6).map((page) => (
                  <button
                    key={page.id}
                    onClick={() => selectPage(page)}
                    className="flex items-start gap-3 rounded-xl border border-theme-border bg-theme-card p-4 text-left transition-all duration-200 hover:border-theme-accent/30 hover:shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-lg bg-theme-hover flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-theme-muted" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-theme-main truncate">{page.title}</h3>
                      {page.description && (
                        <p className="mt-0.5 text-[11px] text-theme-muted truncate">{page.description}</p>
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

  // ===== MAIN EDITOR =====
  return (
    <div
      className="flex flex-1 overflow-hidden"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* ===== HEADER ===== */}
        {!zenMode && (
          <div className="shrink-0 border-b border-theme-border">
            {/* Top row: Title + actions */}
            <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
              {/* Mobile menu button */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-colors md:hidden shrink-0"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <div className="hidden sm:flex items-center gap-1 text-xs text-theme-muted">
                  {breadcrumbs.map((crumb, i) => (
                    <span key={crumb.id} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight className="w-3 h-3" />}
                      <Link href={`/docs/${project.id}/${crumb.slug}`} className="hover:text-theme-subtle transition-colors">
                        {crumb.title}
                      </Link>
                    </span>
                  ))}
                  <ChevronRight className="w-3 h-3" />
                </div>
              )}

              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 bg-transparent text-lg font-semibold text-theme-main outline-none placeholder:text-theme-muted/50 min-w-0"
                placeholder="Page title"
              />

              {/* Right side: status + actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Save status */}
                {autoSaveStatus === 'saving' && (
                  <span className="flex items-center gap-1.5 text-xs text-theme-muted">
                    <Cloud className="w-3 h-3 animate-pulse" />
                    <span className="hidden sm:inline">Saving</span>
                  </span>
                )}
                {autoSaveStatus === 'saved' && !isDirty && (
                  <span className="flex items-center gap-1.5 text-xs text-theme-muted">
                    <Cloud className="w-3 h-3" />
                    <span className="hidden sm:inline">Saved</span>
                  </span>
                )}
                {autoSaveStatus === 'unsaved' && (
                  <span className="flex items-center gap-1.5 text-xs text-amber-500">
                    <CloudOff className="w-3 h-3" />
                    <span className="hidden sm:inline">Unsaved</span>
                  </span>
                )}

                {/* Save button */}
                {isDirty && (
                  <button
                    onClick={() => handleSaveRef.current()}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                )}

                {/* Publish button */}
                {selectedPage && (
                  <button
                    onClick={() => setShowPublishDialog(true)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      pagePublished
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border border-green-500/20'
                        : 'bg-theme-accent text-white hover:bg-theme-accent-hover'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{pagePublished ? 'Published' : 'Publish'}</span>
                  </button>
                )}

                {/* View mode toggle */}
                <div className="flex items-center rounded-lg border border-theme-border bg-theme-page p-0.5">
                  {([
                    { mode: 'edit' as ViewMode, icon: Edit3, label: 'Edit' },
                    { mode: 'split' as ViewMode, icon: SplitSquareHorizontal, label: 'Split' },
                    { mode: 'preview' as ViewMode, icon: Eye, label: 'Preview' },
                  ]).map(({ mode, icon: Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                        viewMode === mode
                          ? 'bg-theme-card text-theme-main shadow-sm'
                          : 'text-theme-muted hover:text-theme-subtle'
                      }`}
                      title={`${label} (⌘⇧P)`}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>

                {/* Sidebar toggle */}
                <button
                  onClick={() => setSidebarTab(sidebarTab ? null : 'outline')}
                  className={`p-1.5 rounded-lg transition-colors duration-150 ${
                    sidebarTab ? 'bg-theme-accent/10 text-theme-accent' : 'text-theme-muted hover:bg-theme-hover hover:text-theme-subtle'
                  }`}
                  title="Toggle sidebar"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>

                {/* Zen mode */}
                <button
                  onClick={() => setZenMode(true)}
                  className="p-1.5 rounded-lg text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors duration-150"
                  title="Zen mode (⌘\\)"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {/* Typewriter mode */}
                <button
                  onClick={() => setTypewriterMode((v) => !v)}
                  className={`p-1.5 rounded-lg transition-colors duration-150 ${
                    typewriterMode ? 'bg-theme-accent/10 text-theme-accent' : 'text-theme-muted hover:bg-theme-hover hover:text-theme-subtle'
                  }`}
                  title="Typewriter mode (⌘⇧T)"
                >
                  <Type className="w-4 h-4" />
                </button>

                {/* AI Panel */}
                <button
                  onClick={() => setShowAIPanel((v) => !v)}
                  className={`p-1.5 rounded-lg transition-colors duration-150 ${
                    showAIPanel ? 'bg-theme-accent/10 text-theme-accent' : 'text-theme-muted hover:bg-theme-hover hover:text-theme-subtle'
                  }`}
                  title="AI Assistant (⌘⇧A)"
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                {/* More actions */}
                <div className="relative" ref={actionsRef}>
                  <button
                    onClick={() => setShowActions((v) => !v)}
                    className="p-1.5 rounded-lg text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors duration-150"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {showActions && (
                    <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-theme-border bg-theme-card shadow-xl py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      <DropdownItem icon={Copy} label="Copy link" onClick={handleCopyLink} />
                      <DropdownItem icon={Layers} label="Duplicate page" onClick={handleDuplicatePage} />
                      <DropdownItem icon={Clock} label="Page history" onClick={() => {}} />
                      <div className="h-px bg-theme-border my-1" />
                      <div className="px-3 py-2">
                        <SchedulePublish pageId={selectedPage.id} />
                      </div>
                      <div className="h-px bg-theme-border my-1" />
                      <DropdownItem icon={Trash2} label="Delete page" onClick={() => { setShowDeleteConfirm(true); setShowActions(false); }} danger />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Draft banner */}
            {draftAvailable && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-amber-500/5 border-t border-amber-500/10">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  <strong>Draft available</strong> — unsaved changes from a previous session
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={restoreDraft} className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-600 transition-colors">
                    Restore
                  </button>
                  <button onClick={clearDraft} className="rounded-md px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors">
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== TOOLBAR ===== */}
        {viewMode !== 'preview' && !zenMode && (
          <EditorToolbar
            onAction={handleToolbarAction}
            hasSelection={false}
          />
        )}

        {/* ===== EDITOR CONTENT ===== */}
        <div ref={splitRef} className="flex flex-1 overflow-hidden relative">
          {/* Drag overlay */}
          {isDragOver && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-theme-accent/5 border-2 border-dashed border-theme-accent/30 rounded-lg m-2">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-theme-accent/10 flex items-center justify-center mx-auto mb-3">
                  <ImageIcon className="w-5 h-5 text-theme-accent" />
                </div>
                <p className="text-sm font-medium text-theme-accent">Drop image here</p>
                <p className="text-xs text-theme-muted mt-1">PNG, JPG, GIF, WebP up to 10MB</p>
              </div>
            </div>
          )}

          {/* Upload overlay */}
          {isUploading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-theme-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 rounded-xl bg-theme-card border border-theme-border px-5 py-3 shadow-xl">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-theme-accent border-t-transparent" />
                <span className="text-sm text-theme-main">Uploading...</span>
              </div>
            </div>
          )}

          {/* Edit mode */}
          {viewMode === 'edit' && (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto px-6 sm:px-8 pt-8 pb-32">
                {showSlashCommands && (
                  <SlashCommandMenu
                    open={showSlashCommands}
                    query={slashQuery}
                    position={slashPosition}
                    onSelect={handleSlashCommandSelect}
                    onClose={() => setShowSlashCommands(false)}
                  />
                )}
                {inlineAIAction && (
                  <InlineAIResult
                    action={inlineAIAction}
                    pageContent={content}
                    selectedText={inlineAISelectedText || undefined}
                    pageTitle={title}
                    pageId={selectedPage?.id}
                    projectId={project.id}
                    onAccept={(newContent) => {
                      setContent(newContent);
                      setInlineAIAction(null);
                    }}
                    onDismiss={() => setInlineAIAction(null)}
                  />
                )}
                <CodeMirrorEditor
                  ref={editorRef}
                  value={content}
                  onChange={setContent}
                  className="min-h-[calc(100vh-280px)]"
                  placeholder="Start writing... Type / for commands"
                  typewriterMode={typewriterMode}
                  onCursorChange={setCursorPos}
                  onSlashCommand={handleSlashCommand}
                  onSlashCommandClose={() => setShowSlashCommands(false)}
                />
              </div>
            </div>
          )}

          {/* Preview mode */}
          {viewMode === 'preview' && (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8">
                <h1 className="mb-6 text-3xl font-bold tracking-tight text-theme-main">{title}</h1>
                {content ? (
                  <Markdown content={content} projectId={project.id} pages={pageList} basePath={`/docs/${project.id}`} />
                ) : (
                  <p className="text-theme-muted italic">No content yet</p>
                )}
              </div>
            </div>
          )}

          {/* Split mode */}
          {viewMode === 'split' && (
            <div className="flex w-full h-full">
              <div className="relative min-w-0 h-full overflow-hidden" style={{ width: `${splitPosition}%` }}>
                <div className="relative h-full overflow-y-auto">
                  <div className="px-6 sm:px-8 pt-8 pb-32">
                    {showSlashCommands && (
                      <SlashCommandMenu
                        open={showSlashCommands}
                        query={slashQuery}
                        position={slashPosition}
                        onSelect={handleSlashCommandSelect}
                        onClose={() => setShowSlashCommands(false)}
                      />
                    )}
                    {inlineAIAction && (
                      <InlineAIResult
                        action={inlineAIAction}
                        pageContent={content}
                        selectedText={inlineAISelectedText || undefined}
                        pageTitle={title}
                        pageId={selectedPage?.id}
                        projectId={project.id}
                        onAccept={(newContent) => {
                          setContent(newContent);
                          setInlineAIAction(null);
                        }}
                        onDismiss={() => setInlineAIAction(null)}
                      />
                    )}
                    <CodeMirrorEditor
                      ref={editorRef}
                      value={content}
                      onChange={setContent}
                      className="min-h-[calc(100vh-280px)]"
                      placeholder="Start writing..."
                      typewriterMode={typewriterMode}
                      onCursorChange={setCursorPos}
                      onSlashCommand={handleSlashCommand}
                      onSlashCommandClose={() => setShowSlashCommands(false)}
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div
                ref={splitDividerRef}
                className="w-1 bg-theme-border hover:bg-theme-accent/30 cursor-col-resize shrink-0 transition-colors duration-150"
              />

              {/* Preview pane */}
              <div className="flex-1 overflow-y-auto min-w-0">
                <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8">
                  <h1 className="mb-6 text-3xl font-bold tracking-tight text-theme-main">{title}</h1>
                  {content ? (
                    <Markdown content={content} projectId={project.id} pages={pageList} basePath={`/docs/${project.id}`} />
                  ) : (
                    <p className="text-theme-muted italic">No content yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== STATUS BAR ===== */}
        {!zenMode && (
          <div className="shrink-0 flex items-center justify-between border-t border-theme-border px-4 sm:px-6 py-1.5 text-[11px] text-theme-muted">
            <div className="flex items-center gap-4">
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
              <span>{charCount} chars</span>
              <span>{wordCount} words</span>
              <span>{readingTime} min read</span>
            </div>
            <div className="flex items-center gap-3">
              {tags.length > 0 && (
                <div className="flex items-center gap-1">
                  {tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded bg-theme-accent/10 text-theme-accent text-[10px]">
                      {tag}
                    </span>
                  ))}
                  {tags.length > 3 && <span>+{tags.length - 3}</span>}
                </div>
              )}
              <span className="px-1.5 py-0.5 rounded bg-theme-hover text-[10px] uppercase tracking-wider">
                {viewMode}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ===== SIDEBAR ===== */}
      {sidebarTab && selectedPage && (
        <div className="w-72 shrink-0 border-l border-theme-border bg-theme-page flex flex-col animate-in slide-in-from-right duration-200">
          {/* Tabs */}
          <div className="flex items-center border-b border-theme-border">
            {([
              { id: 'outline' as SidebarTab, label: 'Outline', icon: ListOrdered },
              { id: 'team' as SidebarTab, label: 'Team', icon: Users },
              { id: 'comments' as SidebarTab, label: 'Comments', icon: MessageSquare },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSidebarTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors duration-150 border-b-2 ${
                  sidebarTab === id
                    ? 'text-theme-accent border-theme-accent'
                    : 'text-theme-muted border-transparent hover:text-theme-subtle'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
            <button
              onClick={() => setSidebarTab(null)}
              className="p-2 text-theme-muted hover:bg-theme-hover transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-3">
            {sidebarTab === 'outline' && <DocumentOutline content={content} activeHeadingId={activeHeadingId} />}
            {sidebarTab === 'team' && <TeamPresence members={teamMembers} />}
            {sidebarTab === 'comments' && <Comments pageId={selectedPage.id} teamMembers={teamMembers} />}
          </div>
        </div>
      )}

      {/* ===== AI PANEL ===== */}
      {showAIPanel && selectedPage && (
        <div className="w-80 shrink-0 border-l border-theme-border bg-theme-page flex flex-col animate-in slide-in-from-right duration-200">
          <AIPanel
            pageId={selectedPage.id}
            projectId={project.id}
            pageTitle={selectedPage.title}
            pageContent={content}
            onClose={() => setShowAIPanel(false)}
          />
        </div>
      )}

      {/* ===== ZEN MODE EXIT BUTTON ===== */}
      {zenMode && (
        <button
          onClick={() => setZenMode(false)}
          className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-theme-card/80 backdrop-blur-sm border border-theme-border text-theme-muted hover:text-theme-subtle hover:bg-theme-card transition-all opacity-0 hover:opacity-100"
          title="Exit zen mode (⌘\\)"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      )}

      {/* ===== HIDDEN FILE INPUT FOR IMAGE UPLOAD ===== */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setIsUploading(true);
          const url = await uploadImage(file);
          if (url && editorRef.current) {
            editorRef.current.insertText(`![${file.name}](${url})`);
          }
          setIsUploading(false);
          e.target.value = '';
        }}
      />

      {/* ===== LINK DIALOG ===== */}
      {showLinkDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLinkDialog(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-theme-border bg-theme-card p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-theme-main mb-4">Insert link</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-theme-muted mb-1 block">Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text"
                  autoFocus
                  className="w-full rounded-lg border border-theme-border bg-theme-page px-3 py-2 text-sm text-theme-main placeholder:text-theme-muted/50 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent/30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const { from, to } = linkSelectionRef.current;
                      const display = linkText || 'link';
                      const markdown = `[${display}](${linkUrl || 'url'})`;
                      const view = editorRef.current?.view;
                      if (view) {
                        view.dispatch({ changes: { from, to, insert: markdown } });
                        view.focus();
                      }
                      setShowLinkDialog(false);
                    }
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-theme-muted mb-1 block">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-theme-border bg-theme-page px-3 py-2 text-sm text-theme-main placeholder:text-theme-muted/50 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent/30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const { from, to } = linkSelectionRef.current;
                      const display = linkText || 'link';
                      const markdown = `[${display}](${linkUrl || 'url'})`;
                      const view = editorRef.current?.view;
                      if (view) {
                        view.dispatch({ changes: { from, to, insert: markdown } });
                        view.focus();
                      }
                      setShowLinkDialog(false);
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button
                onClick={() => setShowLinkDialog(false)}
                className="rounded-lg border border-theme-border px-4 py-2 text-sm font-medium text-theme-subtle hover:bg-theme-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const { from, to } = linkSelectionRef.current;
                  const display = linkText || 'link';
                  const markdown = `[${display}](${linkUrl || 'url'})`;
                  const view = editorRef.current?.view;
                  if (view) {
                    view.dispatch({ changes: { from, to, insert: markdown } });
                    view.focus();
                  }
                  setShowLinkDialog(false);
                }}
                className="rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE MODAL ===== */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-theme-border bg-theme-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-theme-main">Delete page</h3>
                <p className="text-xs text-theme-muted">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-theme-subtle mb-6">
              Are you sure you want to delete <strong>{selectedPage?.title}</strong>?
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
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PUBLISH DIALOG ===== */}
      {showPublishDialog && selectedPage && (
        <PublishDialog
          pageId={selectedPage.id}
          pageTitle={selectedPage.title}
          pageSlug={selectedPage.slug}
          projectId={project.id}
          isPublished={pagePublished}
          onPublish={() => {
            setPagePublished(true);
            setPageList((prev) => prev.map((p) => (p.id === selectedPage.id ? { ...p, published: true } : p)));
          }}
          onUnpublish={() => {
            setPagePublished(false);
            setPageList((prev) => prev.map((p) => (p.id === selectedPage.id ? { ...p, published: false } : p)));
          }}
          onClose={() => setShowPublishDialog(false)}
        />
      )}
    </div>
  );
}

// Dropdown item component
function DropdownItem({ icon: Icon, label, onClick, danger }: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150 ${
        danger
          ? 'text-red-500 hover:bg-red-500/10'
          : 'text-theme-subtle hover:bg-theme-hover'
      }`}
    >
      <Icon className={`w-4 h-4 ${danger ? '' : 'text-theme-muted'}`} />
      {label}
    </button>
  );
}
