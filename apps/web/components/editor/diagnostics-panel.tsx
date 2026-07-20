'use client';

import { useState, useCallback } from 'react';
import type { Diagnostic } from '@fluid/types';
import {
  AlertCircle, AlertTriangle, Info, X, Wrench, Eye,
  ChevronRight, Loader2,
} from 'lucide-react';
import { getHealthService } from '@/lib/health/health-service';

interface DiagnosticsPanelProps {
  pageId: string;
  projectId: string;
  diagnostics: Diagnostic[];
  onJumpToLine?: (line: number) => void;
  onFix?: (diagnostic: Diagnostic, fixedContent: string) => void;
  onDismiss?: (diagnosticId: string) => void;
  content?: string;
}

type SeverityTab = 'all' | 'error' | 'warning' | 'info';

const SEVERITY_CONFIG = {
  error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
} as const;

export function DiagnosticsPanel({
  pageId,
  projectId,
  diagnostics,
  onJumpToLine,
  onFix,
  onDismiss,
  content,
}: DiagnosticsPanelProps) {
  const [activeTab, setActiveTab] = useState<SeverityTab>('all');
  const [fixingId, setFixingId] = useState<string | null>(null);

  const filtered = activeTab === 'all'
    ? diagnostics
    : diagnostics.filter((d) => d.severity === activeTab);

  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;
  const infoCount = diagnostics.filter((d) => d.severity === 'info').length;

  const handleFix = useCallback(async (d: Diagnostic) => {
    if (!d.fixPreview || !content) return;
    setFixingId(d.id);
    try {
      const res = await fetch(`/api/projects/${projectId}/diagnostics/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, fixedContent: d.fixPreview.fixedContent }),
      });
      if (res.ok) {
        onFix?.(d, d.fixPreview.fixedContent);
        getHealthService().invalidatePage(pageId);
      }
    } finally {
      setFixingId(null);
    }
  }, [pageId, projectId, content, onFix]);

  const handleDismiss = useCallback((d: Diagnostic) => {
    onDismiss?.(d.id);
  }, [onDismiss]);

  if (diagnostics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center px-4">
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
          <Wrench className="h-5 w-5 text-green-500" />
        </div>
        <p className="text-sm font-medium text-theme-main">No issues found</p>
        <p className="text-xs text-theme-muted mt-1">This page looks clean</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-theme-border">
        <TabButton
          label="All"
          count={diagnostics.length}
          active={activeTab === 'all'}
          onClick={() => setActiveTab('all')}
        />
        <TabButton
          label="Errors"
          count={errorCount}
          active={activeTab === 'error'}
          onClick={() => setActiveTab('error')}
          color="text-red-500"
        />
        <TabButton
          label="Warnings"
          count={warningCount}
          active={activeTab === 'warning'}
          onClick={() => setActiveTab('warning')}
          color="text-amber-500"
        />
        <TabButton
          label="Info"
          count={infoCount}
          active={activeTab === 'info'}
          onClick={() => setActiveTab('info')}
          color="text-blue-500"
        />
      </div>

      {/* Diagnostic list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((d) => {
          const config = SEVERITY_CONFIG[d.severity];
          const Icon = config.icon;
          return (
            <div
              key={d.id}
              className={`px-3 py-2.5 border-b border-theme-border hover:bg-theme-hover transition-colors ${fixingId === d.id ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-2">
                <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-theme-main leading-tight">{d.title}</p>
                  <p className="text-[11px] text-theme-muted mt-0.5 leading-snug">{d.description}</p>

                  <div className="flex items-center gap-1.5 mt-1.5">
                    {d.line && onJumpToLine && (
                      <button
                        onClick={() => onJumpToLine(d.line!)}
                        className="text-[10px] font-medium text-theme-accent hover:underline underline-offset-2 flex items-center gap-0.5"
                      >
                        Line {d.line}
                        <ChevronRight className="h-2.5 w-2.5" />
                      </button>
                    )}
                    {d.canAutoFix && d.fixPreview && (
                      <button
                        onClick={() => handleFix(d)}
                        disabled={fixingId === d.id}
                        className="text-[10px] font-medium text-green-600 dark:text-green-400 hover:underline flex items-center gap-0.5 disabled:opacity-50"
                      >
                        {fixingId === d.id ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <Wrench className="h-2.5 w-2.5" />
                        )}
                        Fix
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(d)}
                      className="text-[10px] font-medium text-theme-muted hover:text-theme-main flex items-center gap-0.5"
                    >
                      <Eye className="h-2.5 w-2.5" />
                      Ignore
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
  color,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-2 py-2 text-[11px] font-medium border-b-2 transition-colors ${
        active
          ? `border-theme-accent ${color ?? 'text-theme-accent'}`
          : 'border-transparent text-theme-muted hover:text-theme-main'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`ml-1 text-[10px] font-bold ${active ? (color ?? 'text-theme-accent') : 'text-theme-muted'}`}>
          {count}
        </span>
      )}
    </button>
  );
}
