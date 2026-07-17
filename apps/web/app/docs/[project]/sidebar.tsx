'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Plus, BookOpen, Code2, Settings, ChevronDown, ChevronRight,
  ArrowUp, ArrowDown, IndentIncrease, IndentDecrease, ArrowLeft,
  Trash2, Hash, Download, HeartPulse, X, FileText, Sparkles, HelpCircle,
  LayoutGrid, Search, GripVertical,
} from 'lucide-react';
import { useState, useCallback, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { extractTags } from '@/lib/wiki';
import { CommandPalette } from '@/components/command-palette';
import { templates } from '@/lib/templates';

const GraphButtonWithHealth = lazy(() =>
  import('@/components/graph-button-with-health').then((m) => ({ default: m.GraphButtonWithHealth }))
);

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
        className={`group relative flex items-center gap-1 rounded-md px-2 py-1 text-[13px] transition-colors duration-100 ${
          isActive
            ? 'bg-theme-hover text-theme-main font-medium'
            : 'text-theme-subtle hover:bg-theme-hover/60 hover:text-theme-main'
        }`}
        style={{ paddingLeft: `${8 + node.depth * 14}px` }}
      >
        {isActive && (
          <div className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-theme-accent" />
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className={`shrink-0 rounded p-0.5 transition-colors ${
            !hasChildren && 'invisible'
          } ${
            isActive
              ? 'text-theme-accent hover:text-theme-accent-hover'
              : 'text-theme-muted hover:text-theme-subtle'
          }`}
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>

        <Link
          href={`/docs/${projectId}/${node.slug}`}
          className="flex flex-1 items-center gap-1.5 overflow-hidden"
        >
          <GripVertical className="h-3 w-3 shrink-0 text-theme-muted/0 group-hover:text-theme-muted/50 transition-colors" />
          <BookOpen className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-theme-accent' : 'text-theme-muted'}`} />
          <span className="truncate">{node.title}</span>
          {nodeTags.length > 0 && (
            <span className="flex items-center gap-0.5 shrink-0">
              {nodeTags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded bg-theme-hover px-1 py-px text-[10px] font-medium text-theme-muted"
                >
                  {tag}
                </span>
              ))}
              {nodeTags.length > 2 && (
                <span className="text-[10px] text-theme-muted/60">+{nodeTags.length - 2}</span>
              )}
            </span>
          )}
        </Link>

        <div className="hidden items-center gap-px group-hover:flex">
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
            title="Indent"
          >
            <IndentIncrease className="h-3 w-3" />
          </button>
          <button
            onClick={() => onIndent(node.id, 'out', node.parentId, [])}
            className="rounded p-0.5 text-theme-muted hover:text-theme-subtle hover:bg-theme-hover transition-colors"
            title="Outdent"
          >
            <IndentDecrease className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(node.id)}
            className="rounded p-0.5 text-theme-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-xl border border-theme-border bg-theme-card p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-accent/10 text-theme-accent">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-theme-main">Choose a template</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-theme-muted mb-4">
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
              className="flex flex-col items-start rounded-lg border border-theme-border bg-theme-page p-3.5 text-left transition-all hover:border-theme-accent/30 hover:bg-theme-hover"
            >
              <span className="text-[13px] font-medium text-theme-main">{t.name}</span>
              <span className="mt-1 text-[11px] text-theme-muted line-clamp-2 leading-relaxed">{t.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SidebarNavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isExternal?: boolean;
}

function SidebarNavLink({ href, icon, label, isActive, isExternal }: SidebarNavLinkProps) {
  const className = `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-100 ${
    isActive
      ? 'bg-theme-hover text-theme-main'
      : 'text-theme-muted hover:bg-theme-hover/60 hover:text-theme-subtle'
  }`;

  const content = (
    <>
      {isActive && (
        <div className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-theme-accent" />
      )}
      <span className="relative flex items-center gap-2.5">
        {icon}
        {label}
      </span>
    </>
  );

  if (isExternal) {
    return (
      <a href={href} className={`relative ${className}`}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={`relative ${className}`}>
      {content}
    </Link>
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Listen for mobile sidebar toggle
  useEffect(() => {
    const handler = () => setMobileOpen((prev) => !prev);
    window.addEventListener('toggle-sidebar', handler);
    return () => window.removeEventListener('toggle-sidebar', handler);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar-aside flex w-64 flex-col border-r border-theme-border/60 bg-theme-page ${mobileOpen ? 'open' : ''}`}>
        {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-theme-border/40 px-4 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 group"
        >
          <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5">
            <defs>
              <linearGradient id="sidebar-logo" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="#3B3BFF" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#sidebar-logo)" />
            <path
              d="M8 16h16M16 8v16M10 10l12 12M22 10L10 22"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.5"
            />
            <circle cx="16" cy="16" r="4" fill="white" />
          </svg>
          <span className="text-[13px] font-bold text-theme-main group-hover:text-theme-accent transition-colors">
            {project.name}
          </span>
        </Link>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-2 py-2.5">
        {/* Search */}
        <div className="mb-2.5">
          <CommandPalette
            pages={project.pages.map((p) => ({ ...p, projectName: project.name, projectId: project.id }))}
            projects={[{ id: project.id, name: project.name }]}
            currentProjectId={project.id}
          />
        </div>

        {/* Nav links */}
        <nav className="mb-4 space-y-0.5">
          <SidebarNavLink
            href="/dashboard"
            icon={<LayoutGrid className="h-3.5 w-3.5" />}
            label="Dashboard"
          />
          <SidebarNavLink
            href={`/dashboard/${project.id}/import`}
            icon={<Code2 className="h-3.5 w-3.5" />}
            label="Import"
          />
          <SidebarNavLink
            href={`/api/projects/${project.id}/export`}
            icon={<Download className="h-3.5 w-3.5" />}
            label="Export"
            isExternal
          />
          <SidebarNavLink
            href={`/dashboard/${project.id}/health`}
            icon={<HeartPulse className="h-3.5 w-3.5" />}
            label="Health"
          />
          <SidebarNavLink
            href={`/dashboard/${project.id}/settings`}
            icon={<Settings className="h-3.5 w-3.5" />}
            label="Settings"
          />
          <SidebarNavLink
            href="/help"
            icon={<HelpCircle className="h-3.5 w-3.5" />}
            label="Help"
          />
        </nav>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 px-2.5 mb-1.5">
              <Hash className="h-3 w-3 text-theme-muted/60" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted/60">
                Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-1 px-1">
              {allTags.slice(0, 8).map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                    activeTag === tag
                      ? 'bg-theme-accent/15 text-theme-accent'
                      : 'bg-theme-hover text-theme-muted hover:text-theme-subtle'
                  }`}
                >
                  {tag}
                  <span className="opacity-50">{count}</span>
                </button>
              ))}
              {allTags.length > 8 && (
                <span className="text-[11px] text-theme-muted/50 self-center">+{allTags.length - 8}</span>
              )}
            </div>
          </div>
        )}

        {/* Pages header */}
        <div className="mb-1.5 flex items-center justify-between px-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted/60">
            Pages
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="rounded p-1 text-theme-muted/60 hover:bg-theme-hover hover:text-theme-subtle transition-colors"
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
                  ? 'bg-theme-accent/10 text-theme-accent'
                  : 'text-theme-muted/60 hover:bg-theme-hover hover:text-theme-subtle'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Quick create form */}
        {isCreating && (
          <form onSubmit={createPage} className="mb-2.5 rounded-lg border border-theme-border/60 bg-theme-card/50 p-2.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-theme-accent/10 text-theme-accent">
                <Plus className="h-3 w-3" />
              </div>
              <span className="text-[11px] font-medium text-theme-subtle">New page</span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="ml-auto rounded p-0.5 text-theme-muted hover:text-theme-subtle"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <input
              ref={titleInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Page title..."
              className="w-full rounded-md border border-theme-border/60 bg-theme-page px-2.5 py-1.5 text-[13px] text-theme-main placeholder:text-theme-muted/50 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent/30"
            />
            {project.pages.length > 0 && (
              <select
                value={newParentId ?? ''}
                onChange={(e) => setNewParentId(e.target.value || null)}
                className="mt-1.5 w-full rounded-md border border-theme-border/60 bg-theme-page px-2.5 py-1.5 text-[13px] text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent/30"
              >
                <option value="">Top level</option>
                {project.pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    Under: {p.title}
                  </option>
                ))}
              </select>
            )}
            <div className="mt-2 flex items-center gap-1.5">
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="flex-1 rounded-md bg-theme-accent px-2.5 py-1.5 text-[13px] font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors disabled:opacity-40"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-md border border-theme-border/60 px-2.5 py-1.5 text-[13px] font-medium text-theme-subtle hover:bg-theme-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Page tree */}
        <nav className="space-y-px">
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
            <div className="py-10 text-center">
              <BookOpen className="mx-auto h-7 w-7 text-theme-muted/40" />
              <p className="mt-2 text-[13px] text-theme-muted">No pages yet</p>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-2 text-[13px] font-medium text-theme-accent hover:text-theme-accent-hover transition-colors"
              >
                Create your first page
              </button>
            </div>
          )}
          {tree.length === 0 && activeTag && (
            <div className="py-10 text-center">
              <Hash className="mx-auto h-7 w-7 text-theme-muted/40" />
              <p className="mt-2 text-[13px] text-theme-muted">No pages with #{activeTag}</p>
              <button
                onClick={() => setActiveTag(null)}
                className="mt-2 text-[13px] font-medium text-theme-accent hover:text-theme-accent-hover transition-colors"
              >
                Clear filter
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Footer nav */}
      <div className="border-t border-theme-border/40 p-2 space-y-px">
        <Suspense fallback={null}>
          <GraphButtonWithHealth projectId={project.id} pages={project.pages} />
        </Suspense>
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
    </>
  );
}
