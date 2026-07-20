'use client';

import { useState, useMemo } from 'react';
import { X, Search, Sparkles } from 'lucide-react';
import {
  templateService,
  type PageTemplate,
  type TemplateCategory,
} from '@/lib/templates';

interface TemplateGalleryProps {
  mode: 'page' | 'project';
  onSelect: (templateId: string) => void;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<TemplateCategory, string> = {
  'getting-started': '🚀',
  api: '🔌',
  operations: '⚙️',
  planning: '📋',
  reference: '📖',
  process: '🔄',
};

export function TemplateGallery({ mode, onSelect, onClose }: TemplateGalleryProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | null>(null);

  const categories = templateService.getCategories();

  const filteredTemplates = useMemo(() => {
    if (search) {
      const results = templateService.searchPageTemplates(search);
      return results.map((r) => r.template);
    }
    if (mode === 'project') {
      let templates = templateService.getAllProjectTemplates();
      if (activeCategory) {
        templates = templates.filter((t) => t.category === activeCategory);
      }
      return templates;
    }
    let templates = templateService.getAllPageTemplates();
    if (activeCategory) {
      templates = templates.filter((t) => t.category === activeCategory);
    }
    return templates;
  }, [search, activeCategory, mode]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl rounded-xl border border-theme-border bg-theme-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-accent/10 text-theme-accent">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-theme-main">
              {mode === 'project' ? 'Choose a project template' : 'Choose a page template'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-theme-border px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-theme-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full rounded-lg border border-theme-border bg-theme-page pl-9 pr-3 py-2 text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent/20"
            />
          </div>
        </div>

        {/* Category pills */}
        {!search && (
          <div className="flex gap-1.5 border-b border-theme-border px-5 py-2.5 overflow-x-auto">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === null
                  ? 'bg-theme-accent/10 text-theme-accent'
                  : 'bg-theme-hover text-theme-muted hover:text-theme-subtle'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-theme-accent/10 text-theme-accent'
                    : 'bg-theme-hover text-theme-muted hover:text-theme-subtle'
                }`}
              >
                {CATEGORY_ICONS[cat]} {templateService.getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="max-h-80 overflow-y-auto p-5">
          {filteredTemplates.length === 0 ? (
            <p className="text-center text-sm text-theme-muted py-8">
              No templates found.
            </p>
          ) : mode === 'project' ? (
            <div className="grid gap-2">
              {(filteredTemplates as import('@/lib/templates').ProjectTemplate[]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onSelect(t.id);
                    onClose();
                  }}
                  className="flex items-start gap-3 rounded-lg border border-theme-border bg-theme-page p-3.5 text-left transition-all hover:border-theme-accent/30 hover:bg-theme-hover"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-theme-accent/10 text-theme-accent text-sm font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[13px] font-medium text-theme-main block">{t.name}</span>
                    <span className="mt-0.5 text-[11px] text-theme-muted line-clamp-2 leading-relaxed block">{t.description}</span>
                    {t.pages.length > 0 && (
                      <span className="mt-1 text-[10px] text-theme-muted/60 block">
                        {t.pages.length} page{t.pages.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(filteredTemplates as PageTemplate[]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onSelect(t.id);
                    onClose();
                  }}
                  className="flex flex-col items-start rounded-lg border border-theme-border bg-theme-page p-3.5 text-left transition-all hover:border-theme-accent/30 hover:bg-theme-hover"
                >
                  <span className="text-[13px] font-medium text-theme-main">{t.name}</span>
                  <span className="mt-1 text-[11px] text-theme-muted line-clamp-2 leading-relaxed">{t.description}</span>
                  {t.placeholders.length > 0 && (
                    <span className="mt-1.5 text-[10px] text-theme-muted/60">
                      Placeholders: {t.placeholders.map((p) => `{{${p}}}`).join(', ')}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
