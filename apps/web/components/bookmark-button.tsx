'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';

export function BookmarkButton({ pageId }: { pageId: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/pages/${pageId}/bookmark`)
      .then((r) => r.json())
      .then((data) => setBookmarked(data.bookmarked))
      .catch(() => {});
  }, [pageId]);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/bookmark`, { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      setBookmarked(data.bookmarked);
    } catch {
      // silently fail — bookmark state is non-critical
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-lg p-2 transition-colors ${
        bookmarked
          ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
          : 'text-theme-muted hover:bg-theme-hover hover:text-theme-subtle'
      }`}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark page'}
    >
      <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
    </button>
  );
}
