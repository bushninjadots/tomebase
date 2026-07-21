'use client';

import { useState, useEffect } from 'react';
import {
  Lightbulb,
  AlertTriangle,
  Info,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Spinner } from '@fluid/ui';

interface Insight {
  type: string;
  message: string;
  priority: string;
}

interface InsightsData {
  projects: number;
  totalPages: number;
  averageHealthScore: number;
  totalIssues: number;
  totalBrokenLinks: number;
  stalePages: number;
  recentFixes: number;
  insights: Insight[];
  aiGenerated: boolean;
}

export function DashboardInsights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchInsights() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/insights');
      if (!res.ok) throw new Error('Failed to fetch insights');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-theme-border bg-theme-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-theme-accent" />
          <h3 className="text-sm font-semibold text-theme-main">AI Insights</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-theme-muted">
          <Spinner size="sm" /> Loading insights...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-theme-border bg-theme-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-theme-accent" />
            <h3 className="text-sm font-semibold text-theme-main">AI Insights</h3>
          </div>
          <button onClick={fetchInsights} className="text-theme-muted hover:text-theme-accent transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-theme-muted">Could not load insights</p>
      </div>
    );
  }

  if (!data) return null;

  const priorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'medium': return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      default: return <Info className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="rounded-xl border border-theme-border bg-theme-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-theme-accent" />
          <h3 className="text-sm font-semibold text-theme-main">AI Insights</h3>
          {data.aiGenerated && (
            <span className="text-[10px] text-theme-accent bg-theme-accent/10 px-1.5 py-0.5 rounded font-medium">AI</span>
          )}
        </div>
        <button onClick={fetchInsights} className="text-theme-muted hover:text-theme-accent transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 rounded-lg bg-theme-hover">
          <p className="text-lg font-bold text-theme-main">{data.averageHealthScore}</p>
          <p className="text-[10px] text-theme-muted">Health</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-theme-hover">
          <p className="text-lg font-bold text-theme-main">{data.totalIssues}</p>
          <p className="text-[10px] text-theme-muted">Issues</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-theme-hover">
          <p className="text-lg font-bold text-theme-main">{data.stalePages}</p>
          <p className="text-[10px] text-theme-muted">Stale</p>
        </div>
      </div>

      {/* Insights list */}
      <div className="space-y-2">
        {data.insights.length === 0 ? (
          <p className="text-xs text-theme-muted text-center py-2">No insights yet. Add more content to get started.</p>
        ) : (
          data.insights.slice(0, 5).map((insight, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-theme-hover transition-colors">
              {priorityIcon(insight.priority)}
              <p className="text-xs text-theme-subtle leading-relaxed">{insight.message}</p>
            </div>
          ))
        )}
      </div>

      {data.insights.length > 5 && (
        <p className="text-[10px] text-theme-muted text-center mt-3">
          +{data.insights.length - 5} more insight{data.insights.length - 5 === 1 ? '' : 's'}
        </p>
      )}
    </div>
  );
}
