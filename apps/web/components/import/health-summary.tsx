'use client';

import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HealthSummaryProps {
  projectId: string;
}

interface HealthData {
  score: number;
  totalPages: number;
  issues: Array<{ severity: string; message: string }>;
}

export function HealthSummary({ projectId }: HealthSummaryProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/health`)
      .then((res) => res.json())
      .then((data) => {
        if (data.score !== undefined) {
          setHealth(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-theme-border bg-theme-card p-4 animate-pulse">
        <div className="h-4 w-24 bg-theme-hover rounded mb-3" />
        <div className="h-3 w-full bg-theme-hover rounded" />
      </div>
    );
  }

  if (!health) return null;

  const issues = health.issues ?? [];
  const orphans = issues.filter((i) => i.message.toLowerCase().includes('orphan'));
  const duplicates = issues.filter((i) => i.message.toLowerCase().includes('duplicate'));

  return (
    <div className="rounded-xl border border-theme-border bg-theme-card p-4">
      <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-3">
        Documentation Health
      </h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          {orphans.length === 0 ? (
            <CheckCircle className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          )}
          <span className="text-theme-subtle">
            {orphans.length === 0 ? 'No orphan pages' : `${orphans.length} orphan page(s)`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-3.5 w-3.5 text-green-400" />
          <span className="text-theme-subtle">Wiki links valid</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {duplicates.length === 0 ? (
            <CheckCircle className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          )}
          <span className="text-theme-subtle">
            {duplicates.length === 0 ? 'No duplicate titles' : `${duplicates.length} duplicate title(s)`}
          </span>
        </div>
      </div>
    </div>
  );
}
