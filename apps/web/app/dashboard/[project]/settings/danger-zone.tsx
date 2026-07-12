'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

interface ProjectDangerZoneProps {
  projectId: string;
  projectName: string;
}

export function ProjectDangerZone({ projectId, projectName }: ProjectDangerZoneProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const canDelete = typedName === projectName;

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);

    const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
    }
    setDeleting(false);
  }

  return (
    <>
      <div className="rounded-2xl border border-red-500/20 bg-theme-card p-6">
        <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Danger Zone
        </h2>
        <p className="mt-1 text-sm text-theme-subtle">
          Permanently delete this project and all associated documentation, pages, uploads and published content. This action cannot be undone.
        </p>
        <div className="mt-4">
          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Delete Project
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-red-500/20 bg-theme-card p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-theme-main">Delete Project</h3>
            <p className="mt-2 text-sm text-theme-subtle">
              You are about to permanently delete <span className="font-medium text-theme-main">{projectName}</span> and all of its documentation, pages, uploads, and published content.
            </p>
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
              This action cannot be undone. All data will be permanently removed.
            </div>

            <div className="mt-5 space-y-1.5">
              <label htmlFor="confirm-name" className="block text-sm font-medium text-theme-subtle">
                Type <span className="font-mono font-bold text-theme-main">{projectName}</span> to confirm:
              </label>
              <input
                id="confirm-name"
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="w-full rounded-xl border border-theme-border bg-theme-page px-3 py-2.5 text-sm text-theme-main shadow-sm placeholder:text-theme-muted focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder={projectName}
                autoFocus
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); setTypedName(''); }}
                disabled={deleting}
                className="rounded-xl px-4 py-2 text-sm font-medium text-theme-muted hover:bg-theme-hover transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!canDelete || deleting}
                className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
