import { Key, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function ApiAccessSection() {
  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-theme-muted" />
          <h2 className="text-sm font-semibold text-theme-main">API Access</h2>
        </div>
        <span className="text-[10px] text-theme-muted bg-theme-hover px-2 py-0.5 rounded-full border border-theme-border">
          Coming Soon
        </span>
      </div>

      <p className="text-xs text-theme-muted mb-4">
        Personal access tokens for programmatic access to the TomeBase API will be available here.
      </p>

      <div className="rounded-xl border border-theme-border bg-theme-page p-4">
        <p className="text-xs text-theme-subtle">
          Project-level API keys are available in project settings. Personal access tokens are coming soon.
        </p>
      </div>
    </div>
  );
}
