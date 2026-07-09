'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { History, Clock, RotateCcw, X, FileText, Check, AlertCircle } from 'lucide-react';

interface Snapshot {
  id: string;
  pageId: string;
  title: string;
  content: string;
  createdAt: string;
}

export function HistoryButton({ pageId }: { pageId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        title="Page history"
      >
        <History className="h-4 w-4" />
      </button>
      {open && <HistoryModal pageId={pageId} onClose={() => setOpen(false)} />}
    </>
  );
}

function HistoryModal({ pageId, onClose }: { pageId: string; onClose: () => void }) {
  const router = useRouter();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [preview, setPreview] = useState<Snapshot | null>(null);

  useEffect(() => {
    fetch(`/api/pages/${pageId}/snapshots`)
      .then((res) => res.json())
      .then((data) => {
        setSnapshots(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load history');
        setLoading(false);
      });
  }, [pageId]);

  async function handleRestore(snapshotId: string) {
    setRestoring(snapshotId);
    try {
      const res = await fetch(`/api/pages/${pageId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotId }),
      });
      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        setError('Failed to restore');
      }
    } catch {
      setError('Failed to restore');
    }
    setRestoring(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-2xl max-h-[80vh] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        {/* Sidebar - version list */}
        <div className="w-64 shrink-0 border-r border-gray-100 flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <History className="h-4 w-4 text-gray-400" />
              History
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-sm text-gray-400">Loading...</div>
            )}
            {error && (
              <div className="p-4 text-center text-sm text-red-500">{error}</div>
            )}
            {!loading && snapshots.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-400">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No history yet
              </div>
            )}
            {snapshots.map((snap) => (
              <button
                key={snap.id}
                onClick={() => setPreview(snap)}
                className={`w-full px-4 py-3 text-left border-b border-gray-50 transition-colors ${
                  preview?.id === snap.id
                    ? 'bg-fluid-50 border-l-2 border-l-fluid-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 shrink-0 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {new Date(snap.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-medium text-gray-700 truncate">
                  {snap.title}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Preview pane */}
        <div className="flex-1 flex flex-col min-w-0">
          {preview ? (
            <>
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {preview.title}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {new Date(preview.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRestore(preview.id)}
                  disabled={restoring === preview.id}
                  className="flex items-center gap-1.5 rounded-lg bg-fluid-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-fluid-700 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${restoring === preview.id ? 'animate-spin' : ''}`} />
                  {restoring === preview.id ? 'Restoring...' : 'Restore'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-800">
                  {preview.content || <span className="text-gray-300 italic">No content</span>}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <FileText className="h-10 w-10 mx-auto text-gray-200" />
                <p className="mt-3 text-sm text-gray-400">
                  Select a version from the history to preview
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
