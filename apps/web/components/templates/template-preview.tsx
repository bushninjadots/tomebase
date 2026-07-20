'use client';

import { useMemo } from 'react';
import { X, FileText } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { templateService, type PageTemplate } from '@/lib/templates';

interface TemplatePreviewProps {
  templateId: string;
  title?: string;
  onClose: () => void;
}

export function TemplatePreview({ templateId, title = 'My Page', onClose }: TemplatePreviewProps) {
  const template = templateService.getPageTemplate(templateId);

  const content = useMemo(() => {
    if (!template) return '';
    return templateService.resolveContent(templateId, {
      title,
      date: new Date().toLocaleDateString(),
    });
  }, [template, templateId, title]);

  if (!template) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="w-full max-w-2xl rounded-xl border border-theme-border bg-theme-card p-6 shadow-2xl">
          <p className="text-sm text-theme-muted">Template not found.</p>
          <button onClick={onClose} className="mt-4 text-sm text-theme-accent hover:underline">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-3xl max-h-[80vh] rounded-xl border border-theme-border bg-theme-card shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-accent/10 text-theme-accent">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-theme-main">{template.name}</h2>
              <p className="text-xs text-theme-muted">{template.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          {content ? (
            <div className="prose prose-sm prose-theme max-w-none">
              <Markdown content={content} />
            </div>
          ) : (
            <p className="text-sm text-theme-muted italic">Empty template</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-theme-border px-5 py-3 shrink-0">
          <p className="text-xs text-theme-muted">
            Preview with title &ldquo;{title}&rdquo; — placeholders will be replaced when the page is created.
          </p>
        </div>
      </div>
    </div>
  );
}
