'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Users, Globe, MoreHorizontal, Settings, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';

interface ProjectCardProps {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  published: boolean;
  pageCount: number;
  memberCount: number;
  healthScore: number | null;
}

function HealthBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-emerald-500/15 text-emerald-400'
      : score >= 60
        ? 'bg-amber-500/15 text-amber-400'
        : 'bg-red-500/15 text-red-400';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {score}
    </span>
  );
}

export function ProjectCard({
  id,
  name,
  description,
  published,
  pageCount,
  memberCount,
  healthScore,
}: ProjectCardProps) {
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
      <div className="group relative rounded-2xl border border-theme-border bg-theme-card p-5 card-hover">
        <div className="flex items-start justify-between mb-3">
          <Link href={`/docs/${id}`} className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-theme-main group-hover:text-theme-accent transition-colors truncate">
              {name}
            </h3>
          </Link>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            {healthScore !== null && <HealthBadge score={healthScore} />}
            {published && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            )}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowMenu((v) => !v);
                }}
                className="rounded-lg p-1 text-theme-muted opacity-0 group-hover:opacity-100 hover:bg-theme-hover hover:text-theme-subtle transition-all"
                title="Project actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-theme-border bg-theme-card shadow-2xl py-1">
                  <Link
                    href={`/dashboard/${id}/settings`}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-theme-subtle hover:bg-theme-hover transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <Settings className="h-4 w-4 text-theme-muted" />
                    Settings
                  </Link>
                  {published && (
                    <a
                      href={`/p/${id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-theme-subtle hover:bg-theme-hover transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <ExternalLink className="h-4 w-4 text-theme-muted" />
                      View Public
                    </a>
                  )}
                  <div className="border-t border-theme-border my-1" />
                  <button
                    onClick={() => {
                      setShowDelete(true);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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
          <p className="mb-4 text-sm text-theme-muted line-clamp-2 leading-relaxed">{description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-theme-muted pt-3 border-t border-theme-border">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
          {published && (
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Public
            </span>
          )}
        </div>
      </div>

      {showDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDelete(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-theme-border bg-theme-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-theme-main">Delete project</h3>
                <p className="text-xs text-theme-muted">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-theme-subtle mb-6">
              Are you sure you want to delete <strong className="text-theme-main">{name}</strong>? All
              pages and API keys will be permanently removed.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDelete(false)}
                className="rounded-xl border border-theme-border px-4 py-2 text-sm font-medium text-theme-subtle hover:bg-theme-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
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
