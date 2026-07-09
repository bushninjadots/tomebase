'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Eye, Edit3, FileText, ChevronRight, ArrowRight, Hash, Cloud, CloudOff, Bold, Italic, Heading1, Heading2, Link as LinkIcon, Code, List, ListOrdered, Quote } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { findBacklinks, extractTags } from '@/lib/wiki';
import Link from 'next/link';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  description: string | null;
  order: number;
  parentId: string | null;
}

interface Project {
  id: string;
  name: string;
  pages: Page[];
}

export function DocEditor({ project }: { project: Project }) {
  const router = useRouter();
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [pageList, setPageList] = useState<Page[]>(project.pages);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertFormatting(before: string, after: string, fallback: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const insertion = selected ? `${before}${selected}${after}` : `${before}${fallback}${after}`;
    const newContent = content.slice(0, start) + insertion + content.slice(end);
    setContent(newContent);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + insertion.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  const formattingActions = [
    { icon: Bold, label: 'Bold', action: () => insertFormatting('**', '**', 'bold text') },
    { icon: Italic, label: 'Italic', action: () => insertFormatting('*', '*', 'italic text') },
    { icon: Heading1, label: 'Heading 2', action: () => insertFormatting('\n## ', '', 'Heading') },
    { icon: Heading2, label: 'Heading 3', action: () => insertFormatting('\n### ', '', 'Heading') },
    { icon: LinkIcon, label: 'Link', action: () => insertFormatting('[', '](url)', 'link text') },
    { icon: Code, label: 'Inline Code', action: () => insertFormatting('`', '`', 'code') },
    { icon: List, label: 'Bullet List', action: () => insertFormatting('\n- ', '', 'item') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertFormatting('\n1. ', '', 'item') },
    { icon: Quote, label: 'Blockquote', action: () => insertFormatting('\n> ', '', 'quote') },
  ];

  useEffect(() => {
    setPageList(project.pages);
  }, [project.pages]);

  const breadcrumbs = useMemo(() => {
    if (!selectedPage) return [];
    const crumbs: Page[] = [];
    let current = selectedPage;
    let safety = 0;
    while (current.parentId && safety < 10) {
      const parent = pageList.find((p) => p.id === current.parentId);
      if (!parent) break;
      crumbs.unshift(parent);
      current = parent;
      safety++;
    }
    return crumbs;
  }, [selectedPage, pageList]);

  const backlinks = useMemo(
    () => (selectedPage ? findBacklinks(selectedPage.title, pageList) : []),
    [selectedPage, pageList]
  );

  const tags = useMemo(
    () => (selectedPage ? extractTags(selectedPage.content) : []),
    [selectedPage]
  );

  const [dirty, setDirty] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedVersionRef = useRef({ title: '', content: '' });

  const doSave = useCallback(async (t: string, c: string) => {
    if (!selectedPage) return;
    setAutoSaveStatus('saving');
    const res = await fetch(`/api/pages/${selectedPage.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: t, content: c }),
    });
    if (res.ok) {
      savedVersionRef.current = { title: t, content: c };
      setAutoSaveStatus('saved');
      setDirty(false);
      setPageList((prev) =>
        prev.map((p) => (p.id === selectedPage.id ? { ...p, title: t, content: c } : p)),
      );
    } else {
      setAutoSaveStatus('unsaved');
    }
  }, [selectedPage]);

  useEffect(() => {
    if (!selectedPage) return;
    savedVersionRef.current = { title: selectedPage.title, content: selectedPage.content };
    setAutoSaveStatus('saved');
    setDirty(false);
  }, [selectedPage?.id]);

  useEffect(() => {
    if (!selectedPage) return;
    const saved = savedVersionRef.current;
    const isDirty = title !== saved.title || content !== saved.content;
    setDirty(isDirty);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    if (isDirty) {
      setAutoSaveStatus('unsaved');
      saveTimerRef.current = setTimeout(() => {
        doSave(title, content);
      }, 2000);
    }

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [title, content, selectedPage, doSave]);

  async function handleSave() {
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
      setDirty(false);
      setPageList((prev) =>
        prev.map((p) => (p.id === selectedPage.id ? { ...p, title, content } : p)),
      );
    }

    setSaving(false);
    router.refresh();
  }

  function selectPage(page: Page) {
    setSelectedPage(page);
    setTitle(page.title);
    setContent(page.content);
    setPreview(false);
  }

  if (!selectedPage && pageList.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">No pages yet</h2>
          <p className="mt-2 text-sm text-gray-500">
            Create a page from the sidebar or import code to auto-generate docs.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedPage) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-2xl space-y-2 p-8">
          {pageList.map((page) => (
            <button
              key={page.id}
              onClick={() => selectPage(page)}
              className="w-full rounded-xl border border-gray-100 bg-white p-4 text-left transition-all hover:border-fluid-200 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{page.title}</h3>
                <FileText className="h-4 w-4 text-gray-300" />
              </div>
              {page.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-1">{page.description}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-gray-100 px-6 py-2">
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            {breadcrumbs.map((crumb) => (
              <span key={crumb.id} className="flex items-center gap-1">
                <Link
                  href={`/docs/${project.id}/${crumb.slug}`}
                  className="hover:text-gray-600 transition-colors"
                >
                  {crumb.title}
                </Link>
                <ChevronRight className="h-3 w-3" />
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent text-lg font-semibold text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="Page title"
          />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className={`rounded-lg p-2 transition-colors ${
              preview
                ? 'bg-fluid-50 text-fluid-600'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
            title={preview ? 'Edit' : 'Preview'}
          >
            {preview ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {autoSaveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Cloud className="h-3 w-3 animate-pulse" />
              Saving...
            </span>
          )}
          {autoSaveStatus === 'saved' && !dirty && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Cloud className="h-3 w-3" />
              Saved
            </span>
          )}
          {autoSaveStatus === 'unsaved' && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <CloudOff className="h-3 w-3" />
              Unsaved
            </span>
          )}
          {dirty && (
            <>
              <span className="text-xs text-gray-300">|</span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
          </div>
        </div>
      </div>

      {!preview && (
        <div className="flex items-center gap-0.5 border-b border-gray-100 px-4 py-1.5">
          {formattingActions.map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title={btn.label}
            >
              <btn.icon className="h-3.5 w-3.5" />
            </button>
          ))}
          <span className="ml-2 text-[10px] text-gray-300">Markdown</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {preview ? (
          <div className="mx-auto max-w-3xl p-8">
            <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
            {content ? (
              <Markdown
                content={content}
                projectId={project.id}
                pages={pageList}
                basePath={`/docs/${project.id}`}
              />
            ) : (
              <p className="text-gray-400 italic">No content yet</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-full w-full resize-none bg-transparent p-8 font-mono text-sm leading-relaxed text-gray-800 outline-none placeholder:text-gray-300"
            placeholder="Write your documentation in Markdown..."
            spellCheck={false}
          />
        )}
      </div>

      {(tags.length > 0 || backlinks.length > 0) && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <div className="mx-auto flex max-w-3xl gap-8">
            {tags.length > 0 && (
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
                  <Hash className="h-3 w-3" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-fluid-50 px-2.5 py-0.5 text-xs font-medium text-fluid-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {backlinks.length > 0 && (
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
                  <ArrowRight className="h-3 w-3" />
                  Backlinks
                </div>
                <div className="space-y-1">
                  {backlinks.map((bl) => (
                    <Link
                      key={bl.slug}
                      href={`/docs/${project.id}/${bl.slug}`}
                      className="block rounded-lg px-2 py-1 text-sm text-fluid-600 hover:bg-fluid-50 hover:text-fluid-700 transition-colors"
                    >
                      {bl.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
