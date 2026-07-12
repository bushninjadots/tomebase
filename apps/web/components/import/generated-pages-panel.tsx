'use client';

import Link from 'next/link';
import { FileCode, Braces, Type, Box, List, Package, Check, ExternalLink, GitBranch, ArrowRight } from 'lucide-react';
import type { GeneratedPage, ExportKind } from './use-import-wizard';
import { useState } from 'react';

const KIND_ICON: Record<ExportKind, React.ElementType> = {
  function: FileCode,
  interface: Braces,
  type: Type,
  class: Box,
  enum: List,
  namespace: Package,
};

const KIND_COLOR: Record<ExportKind, string> = {
  function: 'text-blue-400',
  interface: 'text-purple-400',
  type: 'text-green-400',
  class: 'text-amber-400',
  enum: 'text-rose-400',
  namespace: 'text-cyan-400',
};

interface GeneratedPagesPanelProps {
  pages: GeneratedPage[];
  projectId: string;
  onSelectSlug: (slug: string) => void;
  selectedSlug: string | null;
}

export function GeneratedPagesPanel({ pages, projectId, onSelectSlug, selectedSlug }: GeneratedPagesPanelProps) {
  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
          Generated Pages ({pages.length})
        </h3>
        <div className="flex gap-1.5">
          <Link
            href={`/docs/${projectId}`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Editor
          </Link>
          <Link
            href={`/docs/${projectId}/graph`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-colors"
          >
            <GitBranch className="h-3 w-3" />
            Graph
          </Link>
        </div>
      </div>

      <div className="space-y-1 overflow-y-auto flex-1 -mx-1 px-1">
        {pages.map((page) => {
          const Icon = KIND_ICON[page.kind] ?? FileCode;
          const color = KIND_COLOR[page.kind] ?? 'text-theme-muted';
          const isSelected = selectedSlug === page.slug;

          return (
            <button
              key={page.id}
              onClick={() => onSelectSlug(page.slug)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                isSelected
                  ? 'bg-theme-accent/10 border border-theme-accent/20'
                  : 'hover:bg-theme-hover border border-transparent'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-theme-accent' : color}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-theme-accent' : 'text-theme-main'}`}>
                  {page.title}
                </p>
                <p className="text-[10px] text-theme-muted truncate">{page.wordCount} words</p>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-theme-accent shrink-0" />}
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-theme-border">
        <div className="flex items-center gap-1.5 text-[11px] text-theme-muted">
          <ArrowRight className="h-3 w-3" />
          Click any page to preview
        </div>
      </div>
    </div>
  );
}
