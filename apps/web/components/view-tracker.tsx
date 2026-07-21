'use client';

import { useEffect } from 'react';

export function ViewTracker({ pageId }: { pageId: string }) {
  useEffect(() => {
    fetch(`/api/pages/${pageId}/view`, { method: 'POST' }).catch(() => {
      // View tracking is best-effort; ignore failures
    });
  }, [pageId]);

  return null;
}
