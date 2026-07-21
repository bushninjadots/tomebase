'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { eventBus } from '@/lib/events';
import { extractDescription } from '@/lib/content';
import type { CodeMirrorEditorRef } from '@/components/editor/codemirror-editor';
import type { DocPage } from '@fluid/types';

interface UseAutosaveOptions {
  projectId: string;
  selectedPage: DocPage | null;
  title: string;
  content: string;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setPageList: React.Dispatch<React.SetStateAction<DocPage[]>>;
  editorRef: React.RefObject<CodeMirrorEditorRef | null>;
  router: ReturnType<typeof useRouter>;
  onToast?: (toast: { title: string; variant?: string }) => void;
}

export function useAutosave({
  selectedPage,
  title,
  content,
  setTitle,
  setContent,
  setPageList,
  editorRef,
  router,
}: UseAutosaveOptions) {
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const [saving, setSaving] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedVersionRef = useRef({ title: '', content: '' });

  const DRAFT_KEY = useMemo(
    () => (selectedPage ? `fluid_draft_${selectedPage.id}` : null),
    [selectedPage]
  );

  // Draft management: check for existing drafts on page change
  useEffect(() => {
    if (!DRAFT_KEY) return;
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && parsed.content !== selectedPage?.content) setDraftAvailable(true);
      }
    } catch { /* ignore */ }
  }, [DRAFT_KEY, selectedPage]);

  // Draft management: persist dirty content to localStorage
  useEffect(() => {
    if (!DRAFT_KEY || !selectedPage) return;
    try {
      const saved = savedVersionRef.current;
      const isDirty = title !== saved.title || content !== saved.content;
      if (isDirty) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, updatedAt: Date.now() }));
      }
    } catch { /* ignore */ }
  }, [title, content, DRAFT_KEY, selectedPage]);

  const clearDraft = useCallback(() => {
    if (DRAFT_KEY) {
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      setDraftAvailable(false);
    }
  }, [DRAFT_KEY]);

  function restoreDraft() {
    if (!DRAFT_KEY) return;
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        setTitle(parsed.title || title);
        setContent(parsed.content || content);
        setDraftAvailable(false);
      }
    } catch { /* ignore */ }
  }

  // Save logic
  const doSave = useCallback(async (t: string, c: string) => {
    if (!selectedPage) return;
    setAutoSaveStatus('saving');
    const description = extractDescription(c);
    const res = await fetch(`/api/pages/${selectedPage.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: t, content: c, description }),
    });
    if (res.ok) {
      savedVersionRef.current = { title: t, content: c };
      setAutoSaveStatus('saved');
      setPageList((prev) => prev.map((p) => (p.id === selectedPage.id ? { ...p, title: t, content: c } : p)));
      eventBus.emit('document:saved', { pageId: selectedPage.id, content: c, snapshotId: '' });
    } else {
      setAutoSaveStatus('unsaved');
    }
  }, [selectedPage, setPageList]);

  // Reset savedVersionRef on page change
  useEffect(() => {
    if (!selectedPage) return;
    savedVersionRef.current = { title: selectedPage.title, content: selectedPage.content };
    setAutoSaveStatus('saved');
  }, [selectedPage?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for proposal acceptances to refresh editor content
  useEffect(() => {
    const unsub = eventBus.on('ai:proposalAccepted', (data) => {
      if (selectedPage && data.pageId === selectedPage.id && data.content) {
        setContent(data.content);
        savedVersionRef.current = { title, content: data.content };
        setPageList((prev) =>
          prev.map((p) => (p.id === selectedPage.id ? { ...p, content: data.content } : p))
        );
      }
    });
    return unsub;
  }, [selectedPage?.id, title, setContent, setPageList]);

  // Autosave debounce timer
  useEffect(() => {
    if (!selectedPage) return;
    const saved = savedVersionRef.current;
    const isDirty = title !== saved.title || content !== saved.content;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    if (isDirty) {
      setAutoSaveStatus('unsaved');
      saveTimerRef.current = setTimeout(() => doSave(title, content), 2000);
    }

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [title, content, selectedPage, doSave]);

  const handleSaveRef = useRef(async () => {});
  handleSaveRef.current = async () => {
    if (!selectedPage) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaving(true);
    const res = await fetch(`/api/pages/${selectedPage.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      savedVersionRef.current = { title, content };
      setAutoSaveStatus('saved');
      clearDraft();
      setPageList((prev) => prev.map((p) => (p.id === selectedPage.id ? { ...p, title, content } : p)));
      fetch(`/api/pages/${selectedPage.id}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      }).catch(() => {});
      eventBus.emit('document:saved', { pageId: selectedPage.id, content, snapshotId: '' });
    }
    setSaving(false);
    router.refresh();
  };

  const handleSave = useCallback(() => {
    handleSaveRef.current();
  }, []);

  return {
    autoSaveStatus,
    saving,
    draftAvailable,
    doSave,
    handleSave,
    clearDraft,
    restoreDraft,
    savedVersionRef,
  };
}
