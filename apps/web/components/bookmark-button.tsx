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
      const data = await res.json();
      setBookmarked(data.bookmarked);
    } catch {}
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-lg p-2 transition-colors ${
        bookmarked
          ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300'
      }`}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark page'}
    >
      <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
    </button>
  );
}
