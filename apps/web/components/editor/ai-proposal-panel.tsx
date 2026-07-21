'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Send, RefreshCw,
  AlertTriangle, Inbox,
} from 'lucide-react';
import { Spinner } from '@fluid/ui';
import { AIProposalCard } from './ai-proposal-card';

interface Proposal {
  id: string;
  changeType: 'replace' | 'insert' | 'delete';
  originalContent: string;
  proposedContent: string;
  explanation: string;
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected';
  source: string;
  createdAt: string;
}

interface ProposalStats {
  pending: number;
  accepted: number;
  rejected: number;
  total: number;
}

interface AIProposalPanelProps {
  pageId: string;
  pageTitle: string;
  onContentUpdate?: (newContent: string) => void;
}

export function AIProposalPanel({ pageId, pageTitle, onContentUpdate }: AIProposalPanelProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<ProposalStats>({ pending: 0, accepted: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  const fetchProposals = useCallback(async () => {
    try {
      const res = await fetch(`/api/ai/proposals?pageId=${pageId}&${filter !== 'all' ? `status=${filter}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals);
        setStats(data.stats);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [pageId, filter]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  async function handleGenerate() {
    if (!instruction.trim()) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, instruction: instruction.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate proposal');
        return;
      }

      setInstruction('');
      await fetchProposals();
    } catch {
      setError('Network error — could not generate proposal');
    } finally {
      setGenerating(false);
    }
  }

  async function handleAccept(id: string) {
    try {
      const res = await fetch(`/api/ai/proposals/${id}/accept`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to apply proposal');
        return;
      }
      if (data.page?.content && onContentUpdate) {
        onContentUpdate(data.page.content);
      }
      await fetchProposals();
    } catch {
      setError('Network error — could not apply proposal');
    }
  }

  async function handleReject(id: string) {
    try {
      await fetch(`/api/ai/proposals/${id}/reject`, { method: 'POST' });
      await fetchProposals();
    } catch {
      setError('Network error — could not reject proposal');
    }
  }

  const filteredProposals = filter === 'all'
    ? proposals
    : proposals.filter((p) => p.status === filter);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-theme-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-theme-accent/10 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-theme-accent" />
          </div>
          <h3 className="text-xs font-semibold text-theme-main">AI Suggestions</h3>
        </div>
        <p className="text-[10px] text-theme-muted mt-1">
          {stats.pending} pending, {stats.accepted} accepted, {stats.rejected} rejected
        </p>
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-b border-theme-border">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
            placeholder="e.g. Add installation instructions..."
            aria-label="AI instruction prompt"
            className="flex-1 rounded-md border border-theme-border bg-theme-page px-2.5 py-1.5 text-[11px] text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent/20"
            disabled={generating}
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !instruction.trim()}
            className="rounded-md bg-theme-accent px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-theme-accent-hover disabled:opacity-50 transition-colors flex items-center gap-1"
          >
            {generating ? <Spinner size="sm" /> : <Send className="w-3 h-3" />}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mt-2">
          {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                filter === f
                  ? 'bg-theme-accent/10 text-theme-accent'
                  : 'text-theme-muted hover:text-theme-subtle'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-3 mt-2 flex items-center gap-1.5 rounded-md bg-red-500/5 border border-red-500/20 px-2.5 py-1.5">
          <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
          <p className="text-[10px] text-red-500">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 text-[10px]">
            &times;
          </button>
        </div>
      )}

      {/* Proposals list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" className="text-theme-muted" />
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Inbox className="w-8 h-8 text-theme-muted/50 mb-2" />
            <p className="text-[11px] text-theme-muted">
              {filter === 'all' ? 'No proposals yet' : `No ${filter} proposals`}
            </p>
            <p className="text-[10px] text-theme-muted/60 mt-0.5">
              Describe what you want to improve
            </p>
          </div>
        ) : (
          filteredProposals.map((proposal) => (
            <AIProposalCard
              key={proposal.id}
              proposal={proposal}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))
        )}
      </div>

      {/* Refresh */}
      <div className="px-3 py-2 border-t border-theme-border">
        <button
          onClick={fetchProposals}
          className="w-full flex items-center justify-center gap-1 rounded-md border border-theme-border px-3 py-1.5 text-[10px] font-medium text-theme-muted hover:bg-theme-hover transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>
    </div>
  );
}
