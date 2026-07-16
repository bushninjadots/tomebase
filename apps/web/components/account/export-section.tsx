'use client';

import { Download, Clock } from 'lucide-react';

export function ExportSection() {
  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-theme-muted" />
          <h2 className="text-sm font-semibold text-theme-main">Export Account Data</h2>
        </div>
        <span className="text-[10px] text-theme-muted bg-theme-hover px-2 py-0.5 rounded-full border border-theme-border">
          Coming Soon
        </span>
      </div>

      <p className="text-xs text-theme-muted mb-4">
        Export your account information, projects, and documentation data.
      </p>

      <button
        disabled
        className="inline-flex items-center gap-2 rounded-lg border border-theme-border bg-theme-page px-4 py-2 text-sm font-medium text-theme-muted cursor-not-allowed opacity-50"
      >
        <Download className="h-4 w-4" />
        Export Data
      </button>
    </div>
  );
}
