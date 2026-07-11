'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, Trash2, X, AlertCircle } from 'lucide-react';

interface Schedule {
  id: string;
  publishAt: string;
  unpublishAt: string | null;
}

export function SchedulePublish({ pageId }: { pageId: string }) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [publishAt, setPublishAt] = useState('');
  const [unpublishAt, setUnpublishAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/pages/${pageId}/schedule`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) setSchedule(data);
      })
      .catch(() => {});
  }, [pageId]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/pages/${pageId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publishAt: new Date(publishAt).toISOString(),
          unpublishAt: unpublishAt ? new Date(unpublishAt).toISOString() : null,
        }),
      });
      if (!res.ok) {
        setError('Failed to save schedule');
        return;
      }
      const data = await res.json();
      setSchedule(data);
      setShowForm(false);
    } catch {
      setError('Network error — could not save schedule');
    }
    setSaving(false);
  }

  async function remove() {
    try {
      const res = await fetch(`/api/pages/${pageId}/schedule`, { method: 'DELETE' });
      if (!res.ok) return;
      setSchedule(null);
    } catch {
      // silently fail on delete
    }
  }

  if (!showForm && !schedule) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-theme-muted hover:bg-theme-hover hover:text-theme-main transition-colors"
      >
        <Clock className="h-4 w-4" />
        Schedule publish
      </button>
    );
  }

  if (schedule) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Scheduled</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Publish {new Date(schedule.publishAt).toLocaleDateString()} at{' '}
                {new Date(schedule.publishAt).toLocaleTimeString()}
                {schedule.unpublishAt && (
                  <> · Unpublish {new Date(schedule.unpublishAt).toLocaleDateString()}</>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={remove}
            className="rounded p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-theme-border bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-theme-main">Schedule publish</h4>
        <button
          onClick={() => setShowForm(false)}
          className="rounded p-1 text-theme-muted hover:text-theme-subtle"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-theme-muted mb-1">
            Publish at
          </label>
          <input
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
            className="w-full rounded-lg border border-theme-border px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-muted mb-1">
            Unpublish at (optional)
          </label>
          <input
            type="datetime-local"
            value={unpublishAt}
            onChange={(e) => setUnpublishAt(e.target.value)}
            className="w-full rounded-lg border border-theme-border px-3 py-1.5 text-sm"
          />
        </div>
        {error && (
          <div className="flex items-center gap-1.5 rounded-lg bg-red-50 p-2 text-xs text-red-600">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </div>
        )}
        <button
          onClick={save}
          disabled={!publishAt || saving}
          className="w-full rounded-lg bg-theme-main px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-colors disabled:opacity-50 dark:bg-fluid-600 dark:hover:bg-fluid-700"
        >
          {saving ? 'Saving...' : 'Schedule'}
        </button>
      </div>
    </div>
  );
}
