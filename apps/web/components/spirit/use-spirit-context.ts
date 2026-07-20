'use client';

import { useEffect, useRef } from 'react';
import { useSpiritStore } from '@fluid/spirit';
import { eventBus } from '@/lib/events';

interface SpiritContextInput {
  projectId: string;
  projectName: string;
  pageId: string | null;
  pageTitle: string;
  pageSlug: string;
  content: string;
  selection: string;
  cursorLine: number;
  pages: { id: string; title: string; slug: string; parentId: string | null }[];
}

export function useSpiritContext(ctx: SpiritContextInput) {
  const setContext = useSpiritStore((s) => s.setContext);
  const prevPageId = useRef<string | null>(null);

  // Sync page context whenever it changes
  useEffect(() => {
    setContext({
      projectId: ctx.projectId,
      currentPage: ctx.pageId
        ? { title: ctx.pageTitle, slug: ctx.pageSlug, id: ctx.pageId }
        : null,
      currentSelection: ctx.selection,
    });
  }, [ctx.projectId, ctx.pageId, ctx.pageTitle, ctx.pageSlug, ctx.selection, setContext]);

  // Listen for document saves to update Spirit
  useEffect(() => {
    const unsub = eventBus.on('document:saved', (data) => {
      // Update the content reference in context so Spirit knows about edits
      const store = useSpiritStore.getState();
      if (store.context.currentPage?.id === data.pageId) {
        useSpiritStore.getState().setContext({
          currentSelection: '',
        });
      }
    });
    return unsub;
  }, []);

  // When page changes, reset selection and notify Spirit
  useEffect(() => {
    if (ctx.pageId && ctx.pageId !== prevPageId.current) {
      prevPageId.current = ctx.pageId;
      setContext({ currentSelection: '' });
    }
  }, [ctx.pageId, setContext]);
}
