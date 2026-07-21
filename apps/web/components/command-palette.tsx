'use client';

import { useState, useEffect, useRef, useCallback, useMemo, useId } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, FileText, FolderOpen, Plus, Settings, Users, HeartPulse,
  Upload, LayoutDashboard, HelpCircle, BookOpen, ArrowRight, Hash,
  Palette, Globe, LogOut, Keyboard, X,
} from 'lucide-react';

export interface CommandPage {
  id: string;
  title: string;
  slug: string;
  projectId: string;
  projectName?: string;
  content: string;
}

export interface CommandProject {
  id: string;
  name: string;
}

interface CommandPaletteProps {
  pages: CommandPage[];
  projects: CommandProject[];
  currentProjectId?: string;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  section: 'pages' | 'actions' | 'recent';
  keywords: string[];
  action: () => void;
  badge?: string;
}

// Fuzzy matching: returns score if query matches, 0 otherwise
function fuzzyScore(query: string, target: string): number {
  const lower = query.toLowerCase();
  const targetLower = target.toLowerCase();
  
  // Exact match
  if (targetLower === lower) return 1000;
  
  // Starts with
  if (targetLower.startsWith(lower)) return 500;
  
  // Contains
  if (targetLower.includes(lower)) return 200;
  
  // Fuzzy character match (characters in order)
  let qi = 0;
  let ti = 0;
  let score = 0;
  let consecutive = 0;
  
  while (qi < lower.length && ti < targetLower.length) {
    if (lower[qi] === targetLower[ti]) {
      qi++;
      consecutive++;
      score += consecutive * 10;
    } else {
      consecutive = 0;
    }
    ti++;
  }
  
  return qi === lower.length ? score : 0;
}

// Highlight matched characters in text
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  
  const lower = query.toLowerCase();
  const targetLower = text.toLowerCase();
  
  // Find substring match first
  const matchIndex = targetLower.indexOf(lower);
  if (matchIndex !== -1) {
    const before = text.slice(0, matchIndex);
    const match = text.slice(matchIndex, matchIndex + query.length);
    const after = text.slice(matchIndex + query.length);
    
    return (
      <>
        {before}
        <span className="bg-theme-accent/20 text-theme-accent rounded px-0.5">{match}</span>
        {after}
      </>
    );
  }
  
  // Try fuzzy match highlighting
  const chars = lower.split('');
  let ti = 0;
  const highlightIndices: number[] = [];
  
  for (const char of chars) {
    while (ti < text.length) {
      if (text[ti]?.toLowerCase() === char) {
        highlightIndices.push(ti);
        ti++;
        break;
      }
      ti++;
    }
  }
  
  if (highlightIndices.length === chars.length) {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    for (const idx of highlightIndices) {
      if (idx > lastIndex) {
        parts.push(<span key={`t${idx}`}>{text.slice(lastIndex, idx)}</span>);
      }
      parts.push(
        <span key={`h${idx}`} className="bg-theme-accent/20 text-theme-accent rounded px-0.5">
          {text[idx]}
        </span>
      );
      lastIndex = idx + 1;
    }
    if (lastIndex < text.length) {
      parts.push(<span key="end">{text.slice(lastIndex)}</span>);
    }
    
    return <>{parts}</>;
  }
  
  return <>{text}</>;
}

export function CommandPalette({ pages, projects, currentProjectId }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  // Recent items stored in localStorage
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tomebase-recent-pages');
      if (stored) setRecentIds(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const addRecent = useCallback((pageId: string) => {
    setRecentIds((prev) => {
      const next = [pageId, ...prev.filter((id) => id !== pageId)].slice(0, 8);
      try { localStorage.setItem('tomebase-recent-pages', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Build command items
  const items = useMemo<CommandItem[]>(() => {
    const result: CommandItem[] = [];

    // Page results
    for (const page of pages) {
      result.push({
        id: `page-${page.id}`,
        label: page.title,
        description: page.projectName || undefined,
        icon: FileText,
        section: 'pages',
        keywords: [page.title, page.projectName || '', page.content.slice(0, 200)],
        action: () => {
          addRecent(page.id);
          router.push(`/docs/${page.projectId}/${page.slug}`);
        },
      });
    }

    // Actions
    result.push(
      {
        id: 'action-create',
        label: 'Create new page',
        description: 'Start writing documentation',
        icon: Plus,
        section: 'actions',
        keywords: ['create', 'new', 'page', 'document', 'write'],
        action: () => {
          if (currentProjectId) {
            router.push(`/docs/${currentProjectId}`);
          } else if (projects[0]) {
            router.push(`/docs/${projects[0].id}`);
          } else {
            router.push('/dashboard/new');
          }
        },
      },
      {
        id: 'action-dashboard',
        label: 'Go to Dashboard',
        description: 'View your workspace overview',
        icon: LayoutDashboard,
        section: 'actions',
        keywords: ['dashboard', 'home', 'overview', 'workspace'],
        action: () => router.push('/dashboard'),
      },
      {
        id: 'action-import',
        label: 'Import code',
        description: 'Auto-generate docs from source code',
        icon: Upload,
        section: 'actions',
        keywords: ['import', 'code', 'generate', 'upload'],
        action: () => {
          if (currentProjectId) {
            router.push(`/dashboard/${currentProjectId}/import`);
          } else if (projects[0]) {
            router.push(`/dashboard/${projects[0].id}/import`);
          }
        },
      },
      {
        id: 'action-health',
        label: 'Health scan',
        description: 'Check documentation quality',
        icon: HeartPulse,
        section: 'actions',
        keywords: ['health', 'scan', 'quality', 'audit', 'check'],
        action: () => {
          if (currentProjectId) {
            router.push(`/dashboard/${currentProjectId}/health`);
          } else if (projects[0]) {
            router.push(`/dashboard/${projects[0].id}/health`);
          }
        },
      },
      {
        id: 'action-invite',
        label: 'Invite team members',
        description: 'Collaborate with your team',
        icon: Users,
        section: 'actions',
        keywords: ['invite', 'team', 'members', 'collaborate', 'share'],
        action: () => router.push('/dashboard/settings'),
      },
      {
        id: 'action-settings',
        label: 'Team settings',
        description: 'Manage your workspace',
        icon: Settings,
        section: 'actions',
        keywords: ['settings', 'team', 'workspace', 'preferences'],
        action: () => router.push('/dashboard/settings'),
      },
      {
        id: 'action-account',
        label: 'Account settings',
        description: 'Manage your profile and security',
        icon: Settings,
        section: 'actions',
        keywords: ['account', 'profile', 'security', 'password'],
        action: () => router.push('/dashboard/account'),
      },
      {
        id: 'action-help',
        label: 'Help & documentation',
        description: 'Learn how to use TomeBase',
        icon: HelpCircle,
        section: 'actions',
        keywords: ['help', 'docs', 'documentation', 'support', 'learn'],
        action: () => router.push('/help'),
      },
      {
        id: 'action-shortcuts',
        label: 'Keyboard shortcuts',
        description: 'View all available shortcuts',
        icon: Keyboard,
        section: 'actions',
        keywords: ['keyboard', 'shortcuts', 'hotkeys', 'bindings'],
        action: () => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: '/', ctrlKey: true }));
        },
      }
    );

    // Project switching
    for (const project of projects) {
      if (project.id === currentProjectId) continue;
      result.push({
        id: `project-${project.id}`,
        label: project.name,
        description: 'Switch to project',
        icon: FolderOpen,
        section: 'actions',
        keywords: [project.name, 'project', 'switch', 'navigate'],
        action: () => router.push(`/docs/${project.id}`),
      });
    }

    return result;
  }, [pages, projects, currentProjectId, router, addRecent]);

  // Recent items
  const recentItems = useMemo(() => {
    return recentIds
      .map((id) => items.find((item) => item.id === `page-${id}`))
      .filter(Boolean) as CommandItem[];
  }, [recentIds, items]);

  // Search/filter with fuzzy matching
  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Show recent + default actions when no query
      const defaults = items.filter((item) => item.section === 'actions').slice(0, 6);
      return [...recentItems.slice(0, 3), ...defaults];
    }
    return items
      .map((item) => {
        let score = fuzzyScore(query, item.label);
        for (const kw of item.keywords) {
          score = Math.max(score, fuzzyScore(query, kw) * 0.5);
        }
        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }, [query, items, recentItems]);

  // Group results by section
  const grouped = useMemo(() => {
    const groups: { label: string; items: CommandItem[] }[] = [];
    const seen = new Set<string>();

    for (const item of filtered) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);

      let sectionLabel: string;
      if (item.section === 'pages') sectionLabel = 'Pages';
      else if (item.section === 'recent') sectionLabel = 'Recent';
      else sectionLabel = 'Actions';

      const existing = groups.find((g) => g.label === sectionLabel);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ label: sectionLabel, items: [item] });
      }
    }

    return groups;
  }, [filtered]);

  // Open/close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    const total = grouped.reduce((sum, g) => sum + g.items.length, 0);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => (prev + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => (prev - 1 + total) % total);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      let idx = 0;
      for (const group of grouped) {
        for (const item of group.items) {
          if (idx === selectedIdx) {
            item.action();
            setOpen(false);
            return;
          }
          idx++;
        }
      }
    }
  }

  // Reset selection on query change
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[aria-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIdx]);

  // Flatten items for selection tracking
  const flatItems = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open command palette (Control+K)"
        className="flex items-center gap-2 rounded-lg border border-theme-border bg-theme-hover px-3 py-1.5 text-sm text-theme-muted hover:border-theme-border hover:text-theme-subtle transition-colors"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Search or jump to...</span>
        <kbd className="ml-4 rounded border border-theme-border bg-theme-card px-1.5 py-0.5 text-[10px] font-medium text-theme-muted">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm pt-[12vh]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-theme-border bg-theme-card shadow-2xl overflow-hidden">
            {/* Input */}
            <div className="flex items-center gap-3 border-b border-theme-border px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-theme-muted" aria-hidden="true" />
              <input
                ref={inputRef}
                id={inputId}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, actions, or jump to..."
                aria-label="Search pages, actions, or jump to"
                role="combobox"
                aria-expanded={flatItems.length > 0}
                aria-controls="command-results"
                aria-activedescendant={
                  flatItems[selectedIdx] ? `command-option-${flatItems[selectedIdx]!.id}` : undefined
                }
                className="flex-1 bg-transparent text-sm text-theme-main outline-none placeholder:text-theme-muted"
                autoFocus
              />
              <kbd
                className="shrink-0 rounded border border-theme-border px-1.5 py-0.5 text-[10px] font-medium text-theme-muted cursor-pointer hover:bg-theme-hover"
                onClick={() => setOpen(false)}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              id="command-results"
              role="listbox"
              aria-label="Results"
              className="max-h-80 overflow-y-auto p-2"
            >
              {!query.trim() && recentItems.length > 0 && (
                <div className="mb-1">
                  <div className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-theme-muted/60">
                    Recent
                  </div>
                  {recentItems.map((item) => {
                    const idx = flatItems.indexOf(item);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        id={`command-option-${item.id}`}
                        role="option"
                        aria-selected={idx === selectedIdx}
                        onClick={() => { item.action(); setOpen(false); }}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          idx === selectedIdx
                            ? 'bg-theme-accent-light text-theme-main'
                            : 'text-theme-subtle hover:bg-theme-hover'
                        }`}
                      >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          idx === selectedIdx ? 'bg-theme-accent/20 text-theme-accent' : 'bg-theme-hover text-theme-muted'
                        }`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-medium">
                          <HighlightedText text={item.label} query={query} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {grouped.map((group) => (
                <div key={group.label} className="mb-1">
                  <div className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-theme-muted/60">
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const idx = flatItems.indexOf(item);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        id={`command-option-${item.id}`}
                        role="option"
                        aria-selected={idx === selectedIdx}
                        onClick={() => { item.action(); setOpen(false); }}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          idx === selectedIdx
                            ? 'bg-theme-accent-light text-theme-main'
                            : 'text-theme-subtle hover:bg-theme-hover'
                        }`}
                      >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          idx === selectedIdx ? 'bg-theme-accent/20 text-theme-accent' : 'bg-theme-hover text-theme-muted'
                        }`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              <HighlightedText text={item.label} query={query} />
                            </span>
                            {item.badge && (
                              <span className="rounded bg-theme-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-theme-accent">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="mt-0.5 text-[11px] text-theme-muted truncate">{item.description}</p>
                          )}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-theme-muted" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              ))}

              {query.trim() && flatItems.length === 0 && (
                <p className="py-6 text-center text-sm text-theme-muted" role="status">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}

              {!query.trim() && flatItems.length === 0 && recentItems.length === 0 && (
                <p className="py-6 text-center text-sm text-theme-muted">
                  Start typing to search pages and actions
                </p>
              )}
            </div>

            {/* Footer hint */}
            <div className="border-t border-theme-border px-4 py-2 flex items-center justify-between text-[11px] text-theme-muted" role="group" aria-label="Keyboard shortcuts">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-theme-border bg-theme-page px-1 py-0.5 text-[9px]">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-theme-border bg-theme-page px-1 py-0.5 text-[9px]">↵</kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-theme-border bg-theme-page px-1 py-0.5 text-[9px]">esc</kbd>
                  close
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
