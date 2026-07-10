'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, MessageSquare, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationComment {
  id: string;
  content: string;
  userName: string;
  pageTitle: string;
  pageSlug: string;
  projectId: string;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [comments, setComments] = useState<NotificationComment[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => {
        setCount(data.count ?? 0);
        setComments(data.comments ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-theme-border bg-theme-page shadow-xl">
          <div className="flex items-center justify-between border-b border-theme-border px-4 py-2.5">
            <span className="text-sm font-semibold text-theme-main">
              Notifications
              {count > 0 && <span className="ml-1.5 text-xs font-normal text-theme-muted">({count})</span>}
            </span>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-0.5 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {comments.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-theme-muted">
              No notifications yet.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {comments.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/docs/${c.projectId}/${c.pageSlug}`);
                  }}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-theme-card transition-colors border-b border-theme-border last:border-0"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fluid-50 text-fluid-600">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-theme-main">
                      <span className="font-medium">{c.userName}</span>
                      {' '}commented on{' '}
                      <span className="font-medium">{c.pageTitle}</span>
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-theme-subtle">{c.content}</p>
                    <p className="mt-0.5 text-xs text-theme-muted">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
