'use client';

import { useState } from 'react';
import { X, Download, FileText, Archive, Globe, FileCode, Check } from 'lucide-react';

type ExportFormat = 'markdown' | 'markdown-zip' | 'html' | 'pdf';

interface ExportOption {
  id: ExportFormat;
  label: string;
  description: string;
  icon: typeof FileText;
  recommended?: boolean;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'markdown-zip',
    label: 'Markdown ZIP',
    description: 'Preserves folder structure, pages, and assets. Recommended for most use cases.',
    icon: Archive,
    recommended: true,
  },
  {
    id: 'markdown',
    label: 'Markdown',
    description: 'Single .md file with all pages combined.',
    icon: FileText,
  },
  {
    id: 'html',
    label: 'Static HTML',
    description: 'Self-contained HTML files. Ready to host anywhere.',
    icon: Globe,
  },
  {
    id: 'pdf',
    label: 'PDF',
    description: 'Generate a PDF of your documentation.',
    icon: FileCode,
  },
];

interface ExportProjectModalProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onClose: () => void;
}

export function ExportProjectModal({ projectId, projectName, open, onClose }: ExportProjectModalProps) {
  const [selected, setSelected] = useState<ExportFormat>('markdown-zip');
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');

  if (!open) return null;

  async function handleExport() {
    setExporting(true);
    setProgress(0);
    setPhase('Preparing export...');

    const phases = [
      { at: 10, text: 'Fetching pages...' },
      { at: 30, text: 'Building structure...' },
      { at: 50, text: 'Generating files...' },
      { at: 70, text: 'Packaging...' },
      { at: 90, text: 'Finalizing...' },
    ];

    let phaseIdx = 0;
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + 3, 95);
        if (phaseIdx < phases.length && next >= phases[phaseIdx]!.at) {
          setPhase(phases[phaseIdx]!.text);
          phaseIdx++;
        }
        return next;
      });
    }, 120);

    try {
      let url: string;
      if (selected === 'pdf') {
        url = `/api/projects/${projectId}/export?format=markdown`;
      } else if (selected === 'html') {
        url = `/api/projects/${projectId}/export?format=html`;
      } else if (selected === 'markdown') {
        url = `/api/projects/${projectId}/export?format=markdown`;
      } else {
        url = `/api/projects/${projectId}/export?format=markdown`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="?(.+?)"?$/);
      const fallbackExt = selected === 'html' ? '.zip' : selected === 'pdf' ? '.md' : '.zip';
      const filename = filenameMatch?.[1] ?? `${projectName}-docs${fallbackExt}`;

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);

      clearInterval(interval);
      setProgress(100);
      setPhase('Complete!');

      setTimeout(() => {
        setExporting(false);
        setProgress(0);
        setPhase('');
        onClose();
      }, 800);
    } catch {
      clearInterval(interval);
      setExporting(false);
      setProgress(0);
      setPhase('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={exporting ? undefined : onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-theme-border bg-theme-card p-6 shadow-2xl">
        <button
          onClick={exporting ? undefined : onClose}
          className="absolute right-4 top-4 text-theme-muted hover:text-theme-main transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-theme-main">Export Project</h2>
          <p className="mt-1 text-sm text-theme-subtle">
            Download <span className="font-medium text-theme-main">{projectName}</span> as documentation files.
          </p>
        </div>

        {!exporting ? (
          <>
            <div className="space-y-2 mb-6">
              {EXPORT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = selected === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelected(option.id)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-theme-accent bg-theme-accent/5 ring-1 ring-theme-accent'
                        : 'border-theme-border bg-theme-page hover:border-theme-muted'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected ? 'border-theme-accent bg-theme-accent' : 'border-theme-border'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-gray-900" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-theme-muted" />
                          <span className="text-sm font-medium text-theme-main">{option.label}</span>
                          {option.recommended && (
                            <span className="rounded-full bg-theme-accent/10 px-2 py-0.5 text-[10px] font-semibold text-theme-accent">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-theme-muted">{option.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm font-medium text-theme-muted hover:bg-theme-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-xl bg-theme-accent px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </>
        ) : (
          <div className="py-6">
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-theme-subtle">{phase}</span>
                <span className="font-medium text-theme-main">{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-theme-hover overflow-hidden">
                <div
                  className="h-full rounded-full bg-theme-accent transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-theme-muted text-center">
              {progress < 100 ? 'Please don\'t close this window.' : 'Download started!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
