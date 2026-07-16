import { Clock, FileText } from 'lucide-react';

export function ActivitySection() {
  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Clock className="h-4 w-4 text-theme-muted" />
        <h2 className="text-sm font-semibold text-theme-main">Recent Activity</h2>
      </div>

      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-10 h-10 rounded-xl bg-theme-hover flex items-center justify-center mb-3">
          <FileText className="h-4 w-4 text-theme-muted/50" />
        </div>
        <p className="text-sm text-theme-muted">No recent activity yet.</p>
        <p className="text-xs text-theme-muted/60 mt-1">Activity will appear here as you create and edit documentation.</p>
      </div>
    </div>
  );
}
