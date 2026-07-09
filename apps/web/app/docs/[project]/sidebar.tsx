'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Plus, BookOpen, Code2, Settings, ChevronDown, ChevronRight,
  ArrowUp, ArrowDown, IndentIncrease, IndentDecrease,
  Trash2, Hash, Tags, Download, HeartPulse,
} from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import { extractTags } from '@/lib/wiki';
import { SearchOverlay } from '@/components/search';
import { GraphButton } from '@/components/graph';
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
        className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors ${
          isActive
            ? 'bg-fluid-50 text-fluid-700 font-medium'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
        style={{ paddingLeft: `${8 + node.depth * 16}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={`shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600 transition-colors ${
            !hasChildren && 'invisible'
          }`}
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        <Link
          href={`/docs/${projectId}/${node.slug}`}
          className="flex flex-1 items-center gap-1.5 overflow-hidden"
        >
          <BookOpen className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="truncate">{node.title}</span>
          {nodeTags.length > 0 && (
            <span className="flex items-center gap-0.5 shrink-0">
              {nodeTags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500"
                >
                  {tag}
                </span>
              ))}
              {nodeTags.length > 2 && (
                <span className="text-[10px] text-gray-400">+{nodeTags.length - 2}</span>
              )}
            </span>
          )}
        </Link>

        <div className="hidden items-center gap-0.5 group-hover:flex">
          <button
            onClick={() => onMove(node.id, 'up')}
            className="rounded p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            title="Move up"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            onClick={() => onMove(node.id, 'down')}
            className="rounded p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            title="Move down"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
          <button
            onClick={() => onIndent(node.id, 'in', node.parentId, [])}
            className="rounded p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            title="Indent (make child of previous)"
          >
            <IndentIncrease className="h-3 w-3" />
          </button>
          <button
            onClick={() => onIndent(node.id, 'out', node.parentId, [])}
            className="rounded p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            title="Outdent (move up a level)"
          >
            <IndentDecrease className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(node.id)}
            className="rounded p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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

export function DocSidebar({ project }: { project: Project }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSlug = pathname?.split('/').pop() ?? null;

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState('blank');
  const [activeTag, setActiveTag] = useState<string | null>(null);

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
    <aside className="flex w-72 flex-col border-r border-gray-100 bg-gray-50/50">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-semibold text-gray-900"
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
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Pages
          </span>
          <button
            onClick={() => {
              setNewTitle('');
              setNewParentId(null);
              setNewTemplate('blank');
              setIsCreating((v) => !v);
            }}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {isCreating && (
          <form onSubmit={createPage} className="mb-3 space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New page title..."
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-fluid-500 focus:outline-none focus:ring-1 focus:ring-fluid-500"
              autoFocus
            />
            <select
              value={newTemplate}
              onChange={(e) => setNewTemplate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 focus:border-fluid-500 focus:outline-none focus:ring-1 focus:ring-fluid-500"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {project.pages.length > 0 && (
              <select
                value={newParentId ?? ''}
                onChange={(e) => setNewParentId(e.target.value || null)}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 focus:border-fluid-500 focus:outline-none focus:ring-1 focus:ring-fluid-500"
              >
                <option value="">Top level (no parent)</option>
                {project.pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    Under: {p.title}
                  </option>
                ))}
              </select>
            )}
          </form>
        )}

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
        </nav>

        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
            <Hash className="h-3 w-3" />
            Tags
            <span className="group relative ml-auto">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-200 text-[9px] text-gray-500 cursor-help font-bold">?</span>
              <span className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-lg text-[11px] font-normal text-gray-600 normal-case opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                Use <code className="text-[10px] bg-gray-100 px-1 rounded">#tag</code> anywhere in your page content. Tags appear here and can be used to filter pages. Click a tag to show only pages with that tag.
              </span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                  activeTag === tag
                    ? 'bg-fluid-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
                <span className="opacity-60">{count}</span>
              </button>
            ))}
            {allTags.length === 0 && (
              <span className="text-xs text-gray-400 italic">None yet</span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 p-3 space-y-1">
        <GraphButton projectId={project.id} pages={project.pages} />
        <button
          onClick={() => setActiveTag(null)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors w-full ${
            allTags.length > 0
              ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              : 'text-gray-300'
          }`}
        >
          <Tags className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">All Tags</span>
          <span className="text-xs text-gray-400">{allTags.length}</span>
        </button>
        {allTags.length > 0 && (
          <div className="ml-6 space-y-0.5 max-h-32 overflow-y-auto">
            {allTags.slice(0, 15).map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors ${
                  activeTag === tag
                    ? 'bg-fluid-50 text-fluid-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Hash className="h-3 w-3 shrink-0 opacity-60" />
                <span className="truncate flex-1 text-left">{tag.replace(/^#/, '')}</span>
                <span className="opacity-50">{count}</span>
              </button>
            ))}
          </div>
        )}
        <Link
          href={`/dashboard/${project.id}/import`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <Code2 className="h-4 w-4" />
          Import from Code
        </Link>
        <a
          href={`/api/projects/${project.id}/export`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export
        </a>
        <Link
          href={`/dashboard/${project.id}/health`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <HeartPulse className="h-4 w-4" />
          Health
        </Link>
        <Link
          href={`/dashboard/${project.id}/settings`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
