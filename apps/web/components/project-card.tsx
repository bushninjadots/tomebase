'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Globe, MoreHorizontal, Settings, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';

interface ProjectCardProps {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  published: boolean;
  pageCount: number;
}

export function ProjectCard({ id, name, description, published, pageCount }: ProjectCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.refresh();
    }
    setDeleting(false);
    setShowDelete(false);
  }

  return (
    <>
      <div className="group relative rounded-xl border border-gray-100 bg-white p-6 transition-all hover:border-fluid-200 hover:shadow-md">
        <div className="flex items-start justify-between">
          <Link href={`/docs/${id}`} className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-fluid-600 transition-colors truncate">
              {name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 ml-2">
            {published && (
              <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                Live
              </span>
            )}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => { e.preventDefault(); setShowMenu((v) => !v); }}
                className="rounded-lg p-1.5 text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600 transition-all"
                title="Project actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-gray-200 bg-white shadow-xl py-1">
                  <Link
                    href={`/dashboard/${id}/settings`}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Settings
                  </Link>
                  {published && (
                    <a
                      href={`/p/${id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                      View Public
                    </a>
                  )}
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => { setShowDelete(true); setShowMenu(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Project
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>
        )}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </span>
          {published && (
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              Public
            </span>
          )}
        </div>
      </div>

      {showDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDelete(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Delete project</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{name}</strong>? All pages and API keys will be permanently removed.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDelete(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
