'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { ExportProjectModal } from '@/components/export-project-modal';

interface ExportProjectSectionProps {
  projectId: string;
  projectName: string;
  pageCount: number;
}

export function ExportProjectSection({ projectId, projectName, pageCount }: ExportProjectSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
        <h2 className="text-lg font-semibold text-theme-main flex items-center gap-2">
          <Download className="h-4 w-4 text-theme-muted" />
          Export Project
        </h2>
        <p className="mt-1 text-sm text-theme-subtle">
          Download all {pageCount} page{pageCount !== 1 ? 's' : ''} as Markdown, HTML, or a structured ZIP archive.
        </p>
        <div className="mt-4">
          <button
            onClick={() => setOpen(true)}
            className="btn-secondary text-sm"
          >
            <Download className="h-4 w-4" />
            Export Project
          </button>
        </div>
      </div>

      <ExportProjectModal
        projectId={projectId}
        projectName={projectName}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
