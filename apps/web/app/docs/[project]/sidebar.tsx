'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Plus, BookOpen, Code2, Settings, ChevronDown, ChevronRight,
  ArrowUp, ArrowDown, IndentIncrease, IndentDecrease, ArrowLeft,
  Trash2, Hash, Download, HeartPulse, X, FileText, Sparkles, HelpCircle,
} from 'lucide-react';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { extractTags } from '@/lib/wiki';
import { SearchOverlay } from '@/components/search';
import { GraphButtonWithHealth } from '@/components/graph-button-with-health';
import { templates } from '@/lib/templates';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  order: number;
  parentId: string | null;
}

interface Project {
  id: string;
  name: string;
  pages: Page[];
}

interface TreeNode extends Page {
  children: TreeNode[];
  depth: number;
}

function buildTree(pages: Page[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const p of pages) {
    map.set(p.id, { ...p, children: [], depth: 0 });
  }

  for (const p of pages) {
    const node = map.get(p.id)!;
    if (p.parentId && map.has(p.parentId)) {
      const parent = map.get(p.parentId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

function PageRow({
  node,
  projectId,
  currentSlug,
  onMove,
  onIndent,
  onDelete,
}: {
  node: TreeNode;
  projectId: string;
  currentSlug: string | null;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onIndent: (id: string, direction: 'in' | 'out', parentId: string | null, siblings: TreeNode[]) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isActive = currentSlug === node.slug;
  const nodeTags = useMemo(() => extractTags(node.content || ''), [node.content]);

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-all duration-150 ${
          isActive
            ? 'bg-fluid-50 text-fluid-700 font-medium shadow-sm dark:bg-fluid-900/30 dark:text-fluid-400'
            : 'text-theme-subtle hover:bg-theme-hover hover:text-theme-main'
        }`}
        style={{ paddingLeft: `${8 + node.depth * 16}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={`shrink-0 rounded p-0.5 transition-colors ${
            !hasChildren && 'invisible'
          } ${
            isActive
              ? 'text-fluid-600 hover:text-fluid-700 dark:text-fluid-400 dark:hover:text-fluid-300'
              : 'text-theme-muted hover:text-theme-subtle'
          }`}
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        <Link
          href={`/docs/${projectId}/${node.slug}`}
          className="flex flex-1 items-center gap-1.5 overflow-hidden"
        >
          <BookOpen className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-fluid-500' : 'text-theme-muted'}`} />
          <span className="truncate">{node.title}</span>
          {nodeTags.length > 0 && (
            <span className="flex items-center gap-0.5 shrink-0">
              {nodeTags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-theme-hover px-1.5 py-0.5 text-[10px] font-medium text-theme-subtle"
                >
                  {tag}
                </span>
              ))}
              {nodeTags.length > 2 && (
                <span className="text-[10px] text-theme-muted">+{nodeTags.length - 2}</span>
              )}
            </span>
          )}
        </Link>

        <div className="hidden items-center gap-0.5 group-hover:flex">
          <button
            onClick={() => onMove(node.id, 'up')}
            className="rounded p-0.5 text-theme-muted hover:text-theme-subtle hover:bg-theme-hover transition-colors"
            title="Move up"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            onClick={() => onMove(node.id, 'down')}
            className="rounded p-0.5 text-theme-muted hover:text-theme-subtle hover:bg-theme-hover transition-colors"
            title="Move down"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
          <button
            onClick={() => onIndent(node.id, 'in', node.parentId, [])}
            className="rounded p-0.5 text-theme-muted hover:text-theme-subtle hover:bg-theme-hover transition-colors"
            title="Indent (make child of previous)"
          >
            <IndentIncrease className="h-3 w-3" />
          </button>
          <button
            onClick={() => onIndent(node.id, 'out', node.parentId, [])}
            className="rounded p-0.5 text-theme-muted hover:text-theme-subtle hover:bg-theme-hover transition-colors"
            title="Outdent (move up a level)"
          >
            <IndentDecrease className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(node.id)}
            className="rounded p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <PageRow
              key={child.id}
              node={child}
              projectId={projectId}
              currentSlug={currentSlug}
              onMove={onMove}
              onIndent={onIndent}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (templateId: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-theme-border bg-theme-page p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fluid-50 text-fluid-600 dark:bg-fluid-900/30 dark:text-fluid-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold text-theme-main">Choose a template</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-theme-muted mb-4">
          Start with a pre-built structure or begin from scratch.
        </p>
        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onSelect(t.id);
                onClose();
              }}
              className="flex flex-col items-start rounded-xl border border-theme-border bg-theme-page p-4 text-left transition-all hover:border-fluid-200 hover:shadow-md"
            >
              <span className="text-sm font-medium text-theme-main">{t.name}</span>
              <span className="mt-1 text-xs text-theme-muted line-clamp-2">{t.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DocSidebar({ project }: { project: Project }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSlug = pathname?.split('/').pop() ?? null;

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState('blank');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isCreating]);

  const allTags = useMemo(() => {
    const freq = new Map<string, number>();
    for (const page of project.pages) {
      for (const tag of extractTags(page.content || '')) {
        freq.set(tag, (freq.get(tag) || 0) + 1);
      }
    }
    return [...freq.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [project.pages]);

  const filteredPages = useMemo(
    () =>
      activeTag
        ? project.pages.filter((p) => extractTags(p.content || '').includes(activeTag))
        : project.pages,
    [project.pages, activeTag]
  );

  const tree = buildTree(filteredPages);

  const refresh = useCallback(() => router.refresh(), [router]);

  async function createPage(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);

    const template = templates.find((t) => t.id === newTemplate);
    const content = template
      ? template.content
          .replace(/\{\{title\}\}/g, newTitle)
          .replace(/\{\{date\}\}/g, new Date().toISOString().split('T')[0]!)
      : '';

    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle,
        content,
        projectId: project.id,
        parentId: newParentId,
      }),
    });

    if (res.ok) {
      setNewTitle('');
      setNewParentId(null);
      setNewTemplate('blank');
      setIsCreating(false);
      refresh();
    } else {
      setIsCreating(false);
    }
  }

  async function movePage(id: string, direction: 'up' | 'down') {
    const sorted = [...project.pages].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((p) => p.id === id);
    if (idx === -1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const current = sorted[idx]!;
    const swap = sorted[swapIdx]!;

    await fetch('/api/pages/move', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: current.id, order: swap.order }),
    });
    await fetch('/api/pages/move', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: swap.id, order: current.order }),
    });

    refresh();
  }

  async function indentPage(id: string, direction: 'in' | 'out', _parentId: string | null, _siblings: TreeNode[]) {
    const page = project.pages.find((p) => p.id === id);
    if (!page) return;

    if (direction === 'in') {
      const sorted = [...project.pages]
        .filter((p) => p.parentId === page.parentId)
        .sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((p) => p.id === id);
      if (idx > 0) {
        const prevParent = sorted[idx - 1]!;
        await fetch('/api/pages/move', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, parentId: prevParent.id }),
        });
        refresh();
      }
    } else {
      const parent = project.pages.find((p) => p.id === page.parentId);
      if (parent) {
        await fetch('/api/pages/move', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, parentId: parent.parentId ?? null }),
        });
        refresh();
      }
    }
  }

  async function deletePage(id: string) {
    if (!confirm('Delete this page?')) return;
    await fetch(`/api/pages/${id}`, { method: 'DELETE' });
    refresh();
  }

  return (
    <aside className="flex w-72 flex-col border-r border-theme-border bg-theme-card/50">
      <div className="flex items-center justify-between border-b border-theme-border px-4 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-semibold text-theme-main"
        >
          <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5">
            <rect width="32" height="32" rx="8" fill="#0c8ee7" />
            <circle cx="16" cy="16" r="4" fill="white" />
          </svg>
          {project.name}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-3">
          <SearchOverlay projectId={project.id} pages={project.pages} />
        </div>

        {/* Tags section at top */}
        {allTags.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-theme-muted mb-2">
              <Hash className="h-3 w-3" />
              Tags
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allTags.slice(0, 8).map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                    activeTag === tag
                      ? 'bg-fluid-600 text-white'
                      : 'bg-theme-hover text-theme-subtle hover:bg-theme-border'
                  }`}
                >
                  {tag}
                  <span className="opacity-60">{count}</span>
                </button>
              ))}
              {allTags.length > 8 && (
                <span className="text-xs text-theme-muted">+{allTags.length - 8} more</span>
              )}
            </div>
          </div>
        )}

        {/* Pages section */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-theme-muted">
            Pages
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="rounded p-1 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
              title="Templates"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setNewTitle('');
                setNewParentId(null);
                setNewTemplate('blank');
                setIsCreating((v) => !v);
              }}
              className={`rounded p-1 transition-colors ${
                isCreating
                  ? 'bg-fluid-100 text-fluid-600 dark:bg-fluid-900/30 dark:text-fluid-400'
                  : 'text-theme-muted hover:bg-theme-hover hover:text-theme-subtle'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Quick create form */}
        {isCreating && (
          <form onSubmit={createPage} className="mb-3 rounded-xl border border-fluid-200 bg-theme-page p-3 dark:border-fluid-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-fluid-50 text-fluid-600 dark:bg-fluid-900/30 dark:text-fluid-400">
                <Plus className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-medium text-theme-subtle">New page</span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="ml-auto rounded p-0.5 text-theme-muted hover:text-theme-subtle"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <input
              ref={titleInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Page title..."
              className="w-full rounded-lg border border-theme-border px-3 py-1.5 text-sm placeholder:text-theme-muted focus:border-fluid-500 focus:outline-none focus:ring-1 focus:ring-fluid-500 bg-theme-page text-theme-main"
            />
            {project.pages.length > 0 && (
              <select
                value={newParentId ?? ''}
                onChange={(e) => setNewParentId(e.target.value || null)}
                className="mt-2 w-full rounded-lg border border-theme-border px-3 py-1.5 text-sm text-theme-muted focus:border-fluid-500 focus:outline-none focus:ring-1 focus:ring-fluid-500 bg-theme-page"
              >
                <option value="">Top level</option>
                {project.pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    Under: {p.title}
                  </option>
                ))}
              </select>
            )}
            <div className="mt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="flex-1 rounded-lg bg-theme-main px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-colors disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-lg border border-theme-border px-3 py-1.5 text-sm font-medium text-theme-subtle hover:bg-theme-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Page tree */}
        <nav className="space-y-0.5">
          {tree.map((node) => (
            <PageRow
              key={node.id}
              node={node}
              projectId={project.id}
              currentSlug={currentSlug}
              onMove={movePage}
              onIndent={indentPage}
              onDelete={deletePage}
            />
          ))}
          {tree.length === 0 && !activeTag && (
            <div className="py-8 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-theme-muted" />
              <p className="mt-2 text-sm text-theme-muted">No pages yet</p>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-2 text-sm font-medium text-fluid-600 hover:text-fluid-700 dark:text-fluid-400 dark:hover:text-fluid-300"
              >
                Create your first page
              </button>
            </div>
          )}
          {tree.length === 0 && activeTag && (
            <div className="py-8 text-center">
              <Hash className="mx-auto h-8 w-8 text-theme-muted" />
              <p className="mt-2 text-sm text-theme-muted">No pages with #{activeTag}</p>
              <button
                onClick={() => setActiveTag(null)}
                className="mt-2 text-sm font-medium text-fluid-600 hover:text-fluid-700 dark:text-fluid-400 dark:hover:text-fluid-300"
              >
                Clear filter
              </button>
            </div>
          )}
        </nav>
      </div>

      <div className="border-t border-theme-border p-3 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <GraphButtonWithHealth projectId={project.id} pages={project.pages} />
        <Link
          href={`/dashboard/${project.id}/import`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-colors"
        >
          <Code2 className="h-4 w-4" />
          Import from Code
        </Link>
        <a
          href={`/api/projects/${project.id}/export`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-colors"
        >
          <Download className="h-4 w-4" />
          Export
        </a>
        <Link
          href={`/dashboard/${project.id}/health`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-colors"
        >
          <HeartPulse className="h-4 w-4" />
          Health
        </Link>
        <Link
          href={`/dashboard/${project.id}/settings`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <Link
          href="/help"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          Help
        </Link>
      </div>

      {/* Template modal */}
      {showTemplateModal && (
        <TemplateModal
          onClose={() => setShowTemplateModal(false)}
          onSelect={(templateId) => {
            setNewTemplate(templateId);
            setIsCreating(true);
          }}
        />
      )}
    </aside>
  );
}
