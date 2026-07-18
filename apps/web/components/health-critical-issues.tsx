'use client';

import type { Diagnostic } from '@fluid/types';
import Link from 'next/link';
import {
  AlertCircle, Unlink, GitBranch, FileX, Clock, Heading,
  Code, ArrowRight, ChevronRight,
} from 'lucide-react';

interface CriticalIssuesPanelProps {
  diagnostics: Diagnostic[];
  projectId: string;
}

const CATEGORY_ICONS: Partial<Record<string, React.ComponentType<{ className?: string }>>> = {
  broken_link: Unlink,
  orphan_page: GitBranch,
  empty_page: FileX,
  stale_docs: Clock,
  heading_hierarchy: Heading,
  missing_code_block_language: Code,
  broken_image: Unlink,
};

function getIcon(category: string) {
  return CATEGORY_ICONS[category] || AlertCircle;
}

export function CriticalIssuesPanel({ diagnostics, projectId }: CriticalIssuesPanelProps) {
  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');

  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 overflow-hidden">
          <div className="px-5 py-3 border-b border-red-500/10 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-semibold text-red-500">Critical Issues</h3>
            <span className="ml-auto text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">{errors.length}</span>
          </div>
          <div className="divide-y divide-red-500/10">
            {errors.slice(0, 8).map((d) => {
              const Icon = getIcon(d.category);
              return (
                <div key={d.id} className="px-5 py-3 flex items-start gap-3 hover:bg-red-500/5 transition-colors">
                  <Icon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-theme-main">{d.title}</p>
                    <p className="text-xs text-theme-muted mt-0.5 truncate">{d.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Link
                        href={`/docs/${projectId}/${d.pageSlug}`}
                        className="text-[11px] font-medium text-theme-accent hover:underline underline-offset-2 flex items-center gap-0.5"
                      >
                        {d.pageTitle}
                        <ChevronRight className="h-2.5 w-2.5" />
                      </Link>
                      {d.line && (
                        <span className="text-[10px] text-theme-muted">Line {d.line}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {errors.length > 8 && (
            <div className="px-5 py-2 border-t border-red-500/10 text-center">
              <span className="text-[11px] text-red-500/70">+{errors.length - 8} more errors</span>
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-500/10 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-amber-500">Warnings</h3>
            <span className="ml-auto text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">{warnings.length}</span>
          </div>
          <div className="divide-y divide-amber-500/10">
            {warnings.slice(0, 6).map((d) => {
              const Icon = getIcon(d.category);
              return (
                <div key={d.id} className="px-5 py-3 flex items-start gap-3 hover:bg-amber-500/5 transition-colors">
                  <Icon className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-theme-main">{d.title}</p>
                    <p className="text-xs text-theme-muted mt-0.5 truncate">{d.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Link
                        href={`/docs/${projectId}/${d.pageSlug}`}
                        className="text-[11px] font-medium text-theme-accent hover:underline underline-offset-2 flex items-center gap-0.5"
                      >
                        {d.pageTitle}
                        <ChevronRight className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {warnings.length > 6 && (
            <div className="px-5 py-2 border-t border-amber-500/10 text-center">
              <span className="text-[11px] text-amber-500/70">+{warnings.length - 6} more warnings</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
