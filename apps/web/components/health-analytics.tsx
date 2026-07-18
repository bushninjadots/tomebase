'use client';

import {
  FileText, CheckCircle, BookOpen, Clock, Code, Activity,
  Eye, TrendingUp, BarChart3, Layers,
} from 'lucide-react';

interface HealthAnalyticsProps {
  totalPages: number;
  perfectPages: number;
  totalWords: number;
  avgReadingTime: number;
  repoIndexStats: {
    codeBlocks: number;
    mermaidDiagrams: number;
    tables: number;
    totalEntries: number;
  } | null;
  pagesWithZeroViews: number;
  totalPagesWithContent: number;
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color?: string;
  description?: string;
}

function StatCard({ icon: Icon, label, value, color = 'text-theme-main', description }: StatCardProps) {
  return (
    <div className="rounded-xl border border-theme-border bg-theme-card p-4 hover:border-theme-accent/20 transition-colors group">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-hover group-hover:bg-theme-accent-light transition-colors">
          <Icon className="h-3.5 w-3.5 text-theme-muted group-hover:text-theme-accent transition-colors" />
        </div>
        <span className="text-[11px] font-medium text-theme-muted uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
      {description && (
        <p className="text-[10px] text-theme-muted mt-1">{description}</p>
      )}
    </div>
  );
}

export function HealthAnalytics({
  totalPages,
  perfectPages,
  totalWords,
  avgReadingTime,
  repoIndexStats,
  pagesWithZeroViews,
  totalPagesWithContent,
}: HealthAnalyticsProps) {
  const coveragePercent = totalPages > 0 ? Math.round((totalPagesWithContent / totalPages) * 100) : 0;
  const perfectPercent = totalPages > 0 ? Math.round((perfectPages / totalPages) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Content Stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-theme-accent" />
          <h3 className="text-sm font-semibold text-theme-main">Content Analytics</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={FileText}
            label="Total Pages"
            value={totalPages}
            description={`${perfectPercent}% perfect`}
          />
          <StatCard
            icon={CheckCircle}
            label="Perfect Pages"
            value={perfectPages}
            color="text-green-500"
            description={`${perfectPercent}% of total`}
          />
          <StatCard
            icon={BookOpen}
            label="Total Words"
            value={totalWords.toLocaleString()}
            description={`${totalPages > 0 ? Math.round(totalWords / totalPages).toLocaleString() : 0} avg/page`}
          />
          <StatCard
            icon={Clock}
            label="Avg. Read Time"
            value={`${avgReadingTime} min`}
            description="Per page"
          />
        </div>
      </div>

      {/* Engagement & Coverage */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Eye className="h-4 w-4 text-theme-accent" />
          <h3 className="text-sm font-semibold text-theme-main">Engagement & Coverage</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            icon={Layers}
            label="Content Coverage"
            value={`${coveragePercent}%`}
            color={coveragePercent >= 80 ? 'text-green-500' : coveragePercent >= 50 ? 'text-amber-500' : 'text-red-500'}
            description={`${totalPagesWithContent} of ${totalPages} pages have content`}
          />
          <StatCard
            icon={TrendingUp}
            label="Pages with Views"
            value={totalPages - pagesWithZeroViews}
            color="text-theme-main"
            description={`${pagesWithZeroViews} pages with zero views`}
          />
          {repoIndexStats && (
            <StatCard
              icon={Code}
              label="Indexed Assets"
              value={repoIndexStats.totalEntries}
              color="text-theme-main"
              description={`${repoIndexStats.codeBlocks} code, ${repoIndexStats.mermaidDiagrams} diagrams`}
            />
          )}
        </div>
      </div>

      {/* Repository Index */}
      {repoIndexStats && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Code className="h-4 w-4 text-theme-accent" />
            <h3 className="text-sm font-semibold text-theme-main">Repository Index</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Code} label="Code Blocks" value={repoIndexStats.codeBlocks} />
            <StatCard icon={Activity} label="Diagrams" value={repoIndexStats.mermaidDiagrams} />
            <StatCard icon={FileText} label="Tables" value={repoIndexStats.tables} />
            <StatCard icon={Layers} label="Total Entries" value={repoIndexStats.totalEntries} />
          </div>
        </div>
      )}
    </div>
  );
}
