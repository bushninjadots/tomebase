'use client';

import { useState } from 'react';
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

  function renderBranch(page: PageNode, depth: number) {
    const children = map.get(page.id) || [];
    return (
      <li key={page.id}>
        <Link
          href={`/p/${page.slug}`}
          onClick={() => setOpen(false)}
          className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
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
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-gray-900">Pages</span>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 56px)' }}>
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
