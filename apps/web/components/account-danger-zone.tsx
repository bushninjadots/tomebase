'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

interface AccountDangerZoneProps {
  userId: string;
}

export function AccountDangerZone({ userId }: AccountDangerZoneProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const canDelete = typedText === 'DELETE';

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);

    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        window.location.href = '/';
      }
    } catch {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-red-500/20 bg-theme-card p-6">
        <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Danger Zone
        </h2>
        <p className="mt-1 text-sm text-theme-subtle">
          Permanently delete your account and all associated data.
        </p>
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-theme-border bg-theme-page p-4 text-xs text-theme-muted space-y-1.5">
            <p className="font-medium text-theme-subtle text-sm mb-2">Deleting your account permanently removes:</p>
            <div className="grid grid-cols-2 gap-1">
              <div className="flex items-center gap-2"><span className="text-theme-muted">-</span> All projects</div>
              <div className="flex items-center gap-2"><span className="text-theme-muted">-</span> Documentation</div>
              <div className="flex items-center gap-2"><span className="text-theme-muted">-</span> Published sites</div>
              <div className="flex items-center gap-2"><span className="text-theme-muted">-</span> API Keys</div>
              <div className="flex items-center gap-2"><span className="text-theme-muted">-</span> Team memberships</div>
              <div className="flex items-center gap-2"><span className="text-theme-muted">-</span> Uploads</div>
              <div className="flex items-center gap-2"><span className="text-theme-muted">-</span> Account data</div>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Delete Account
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
            <h3 className="text-lg font-semibold text-theme-main">Delete Account</h3>
            <p className="mt-2 text-sm text-theme-subtle">
              You are about to permanently delete your account. This will remove all of your projects, documentation, published sites, API keys, team memberships, uploads, and account data.
            </p>
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
              This action cannot be undone. All data will be permanently removed.
            </div>

            <div className="mt-5 space-y-1.5">
              <label htmlFor="confirm-delete" className="block text-sm font-medium text-theme-subtle">
                Type <span className="font-mono font-bold text-theme-main">DELETE</span> to confirm:
              </label>
              <input
                id="confirm-delete"
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                className="w-full rounded-xl border border-theme-border bg-theme-page px-3 py-2.5 text-sm text-theme-main shadow-sm placeholder:text-theme-muted focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="DELETE"
                autoFocus
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); setTypedText(''); }}
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
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
