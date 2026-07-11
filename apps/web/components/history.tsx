'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { History, Clock, RotateCcw, X, FileText, GitCompare, Check, ArrowLeft } from 'lucide-react';
import { DiffViewer } from '@/components/diff-viewer';

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
        className="rounded-lg p-2 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
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
  const [mode, setMode] = useState<'preview' | 'compare'>('preview');
  const [compareSelection, setCompareSelection] = useState<Snapshot[]>([]);

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

  function handleCompareSelect(snapshot: Snapshot) {
    if (mode !== 'compare') return;
    
    setCompareSelection((prev) => {
      if (prev.length === 0) {
        return [snapshot];
      }
      if (prev.length === 1) {
        // If clicking same snapshot, deselect
        if (prev[0]!.id === snapshot.id) {
          return [];
        }
        // If clicking older snapshot, make it the "old" one
        if (new Date(snapshot.createdAt) < new Date(prev[0]!.createdAt)) {
          return [snapshot, prev[0]!];
        }
        return [prev[0]!, snapshot];
      }
      // Reset selection
      return [snapshot];
    });
  }

  function exitCompareMode() {
    setMode('preview');
    setCompareSelection([]);
  }

  function toggleMode() {
    if (mode === 'compare') {
      exitCompareMode();
    } else {
      setMode('compare');
      setPreview(null);
      setCompareSelection([]);
    }
  }

  const isSelected = (snap: Snapshot) => compareSelection.some((s) => s.id === snap.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-4xl max-h-[85vh] rounded-2xl border border-theme-border bg-theme-page shadow-2xl overflow-hidden">
        {/* Sidebar - version list */}
        <div className="w-72 shrink-0 border-r border-theme-border flex flex-col">
          <div className="flex items-center justify-between border-b border-theme-border px-4 py-3">
            <h3 className="text-sm font-semibold text-theme-main flex items-center gap-2">
              <History className="h-4 w-4 text-theme-muted" />
              History
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMode}
                className={`rounded-lg p-1.5 transition-colors ${
                  mode === 'compare'
                    ? 'bg-fluid-50 text-fluid-600'
                    : 'text-theme-muted hover:bg-theme-hover hover:text-theme-subtle'
                }`}
                title={mode === 'compare' ? 'Exit compare mode' : 'Compare versions'}
              >
                <GitCompare className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {mode === 'compare' && (
            <div className="border-b border-theme-border bg-fluid-50/50 px-4 py-2">
              <p className="text-xs text-fluid-700">
                {compareSelection.length === 0
                  ? 'Select two versions to compare'
                  : compareSelection.length === 1
                  ? 'Select one more version'
                  : 'Comparing selected versions'}
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-sm text-theme-muted">Loading...</div>
            )}
            {error && (
              <div className="p-4 text-center text-sm text-red-500">{error}</div>
            )}
            {!loading && snapshots.length === 0 && (
              <div className="p-4 text-center text-sm text-theme-muted">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No history yet
              </div>
            )}
            {snapshots.map((snap, i) => {
              const selected = isSelected(snap);
              const isPreviewing = mode === 'preview' && preview?.id === snap.id;
              const compareIndex = compareSelection.findIndex((s) => s.id === snap.id);
              
              return (
                <button
                  key={snap.id}
                  onClick={() => mode === 'compare' ? handleCompareSelect(snap) : setPreview(snap)}
                  className={`w-full px-4 py-3 text-left border-b border-theme-border transition-colors ${
                    isPreviewing
                      ? 'bg-fluid-50 border-l-2 border-l-fluid-500'
                      : selected
                      ? 'bg-fluid-50 border-l-2 border-l-fluid-400'
                      : 'hover:bg-theme-hover'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {mode === 'compare' && (
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selected
                          ? 'border-fluid-500 bg-fluid-500'
                          : 'border-theme-border'
                      }`}>
                        {selected && (
                          <span className="text-[8px] text-white font-bold">
                            {compareIndex === 0 ? '1' : '2'}
                          </span>
                        )}
                      </div>
                    )}
                    <Clock className="h-3 w-3 shrink-0 text-theme-muted" />
                    <span className="text-xs text-theme-muted">
                      {new Date(snap.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-theme-subtle truncate">
                    {snap.title}
                  </p>
                  {i < snapshots.length - 1 && (
                    <p className="text-[10px] text-theme-muted mt-0.5">
                      {getDiffSummary(snapshots[i + 1]!, snap)}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview/Diff pane */}
        <div className="flex-1 flex flex-col min-w-0">
          {mode === 'compare' ? (
            compareSelection.length === 2 ? (
              <div className="flex-1 overflow-y-auto p-5">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={exitCompareMode}
                    className="rounded-lg p-1.5 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h4 className="text-sm font-semibold text-theme-main">Comparing versions</h4>
                    <p className="text-xs text-theme-muted">
                      {new Date(compareSelection[0]!.createdAt).toLocaleString()} → {new Date(compareSelection[1]!.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <DiffViewer
                  oldText={compareSelection[0]!.content || ''}
                  newText={compareSelection[1]!.content || ''}
                  oldLabel={compareSelection[0]!.title}
                  newLabel={compareSelection[1]!.title}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8">
                  <GitCompare className="h-10 w-10 mx-auto text-theme-muted" />
                  <p className="mt-3 text-sm text-theme-muted">
                    Select two versions to compare
                  </p>
                  <p className="mt-1 text-xs text-theme-muted">
                    {compareSelection.length === 0 ? 'Click two versions in the list' : 'Click one more version'}
                  </p>
                </div>
              </div>
            )
          ) : preview ? (
            <>
              <div className="flex items-center justify-between border-b border-theme-border px-5 py-3">
                <div>
                  <h4 className="text-sm font-semibold text-theme-main truncate">
                    {preview.title}
                  </h4>
                  <p className="text-xs text-theme-muted">
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
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-theme-main">
                  {preview.content || <span className="text-theme-muted italic">No content</span>}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <FileText className="h-10 w-10 mx-auto text-theme-muted" />
                <p className="mt-3 text-sm text-theme-muted">
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

function getDiffSummary(oldSnap: Snapshot, newSnap: Snapshot): string {
  const oldLines = (oldSnap.content || '').split('\n').length;
  const newLines = (newSnap.content || '').split('\n').length;
  const diff = newLines - oldLines;
  if (diff === 0) return 'No line changes';
  if (diff > 0) return `+${diff} lines`;
  return `${diff} lines`;
}
