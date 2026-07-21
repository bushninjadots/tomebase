'use client';

import { useEffect, useState } from 'react';
import { Clock, FileText, FolderPlus, KeyRound, LogIn, Send, RefreshCw } from 'lucide-react';

interface ActivityEvent {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

const ACTION_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  'page.created': { label: 'Created page', icon: FileText, color: 'text-emerald-500' },
  'page.updated': { label: 'Updated page', icon: FileText, color: 'text-blue-500' },
  'page.published': { label: 'Published page', icon: Send, color: 'text-purple-500' },
  'project.created': { label: 'Created project', icon: FolderPlus, color: 'text-amber-500' },
  'api_key.created': { label: 'Created API key', icon: KeyRound, color: 'text-red-500' },
  'user.login': { label: 'Signed in', icon: LogIn, color: 'text-theme-muted' },
};

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] ?? { label: action.replace(/[._]/g, ' '), icon: RefreshCw, color: 'text-theme-muted' };
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getEntityTitle(event: ActivityEvent): string {
  if (!event.details) return '';
  try {
    const parsed = JSON.parse(event.details);
    return parsed.title ?? parsed.name ?? '';
  } catch {
    return '';
  }
}

export function ActivitySection() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/account/activity?limit=20')
      .then((r) => r.json())
      .then((data) => setEvents(data.events ?? []))
      .catch(() => {
        // Activity load is best-effort; empty list will be shown
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Clock className="h-4 w-4 text-theme-muted" />
        <h2 className="text-sm font-semibold text-theme-main">Recent Activity</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-theme-hover" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-theme-hover rounded w-2/3" />
                <div className="h-2.5 bg-theme-hover rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-theme-hover flex items-center justify-center mb-3">
            <FileText className="h-4 w-4 text-theme-muted/50" />
          </div>
          <p className="text-sm text-theme-muted">No recent activity yet.</p>
          <p className="text-xs text-theme-muted/60 mt-1">Activity will appear here as you create and edit documentation.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {events.map((event) => {
            const config = getActionConfig(event.action);
            const Icon = config.icon;
            const title = getEntityTitle(event);

            return (
              <div
                key={event.id}
                className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-theme-hover transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg bg-theme-hover flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-theme-main truncate">
                    {config.label}
                    {title && <span className="text-theme-subtle ml-1">{title}</span>}
                  </p>
                  <p className="text-xs text-theme-muted">{formatTimeAgo(event.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
