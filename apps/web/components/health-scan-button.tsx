'use client';

import { useState } from 'react';
import { Scan, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export function HealthScanButton({ projectId }: { projectId: string }) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ score: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    setScanning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/health`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleScan}
        disabled={scanning}
        className="inline-flex items-center gap-2 rounded-lg border border-theme-border bg-theme-card px-4 py-2 text-sm font-medium text-theme-main hover:bg-theme-hover transition-colors disabled:opacity-50"
      >
        {scanning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Scan className="h-4 w-4" />
        )}
        {scanning ? 'Scanning...' : 'Run Health Scan'}
      </button>
      {result && (
        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <CheckCircle className="h-3 w-3" />
          Score: {result.score}
        </span>
      )}
      {error && (
        <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </span>
      )}
    </div>
  );
}
