'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

interface PageNode {
  id: string;
  title: string;
  slug: string;
  parentId: string | null;
}

export function PublicMobileNav({ pages, projectId }: { pages: PageNode[]; projectId: string }) {
  const [open, setOpen] = useState(false);

  const map = new Map<string, PageNode[]>();
  const roots: PageNode[] = [];
  for (const page of pages) {
    if (!page.parentId) {
      roots.push(page);
    } else {
      const existing = map.get(page.parentId) || [];
      existing.push(page);
      map.set(page.parentId, existing);
    }
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function renderBranch(page: PageNode, depth: number) {
    const children = map.get(page.id) || [];
    return (
      <li key={page.id}>
        <Link
          href={`/p/${projectId}/${page.slug}`}
          onClick={() => setOpen(false)}
          className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-colors"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <span className="h-1 w-1 rounded-full bg-theme-muted/30 group-hover:bg-theme-accent transition-colors shrink-0" />
          {page.title}
        </Link>
        {children.length > 0 && (
          <ul className="space-y-0.5">
            {children.map((child) => renderBranch(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg p-1.5 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-[#0B1020] border-r border-white/[0.06] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <span className="text-[13px] font-semibold text-theme-main">Navigation</span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="overflow-y-auto p-3" style={{ maxHeight: 'calc(100vh - 52px)' }}>
              <ul className="space-y-0.5">
                {roots.map((page) => renderBranch(page, 0))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
