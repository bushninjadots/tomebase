'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, X, FileDiff, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { SpiritProposal } from '@fluid/spirit';
import { useSpiritStore } from '@fluid/spirit';

interface SpiritProposalCardProps {
  proposal: SpiritProposal;
}

export function SpiritProposalCard({ proposal }: SpiritProposalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(proposal.status);
  const [loading, setLoading] = useState(false);
  const addMessage = useSpiritStore((s) => s.addMessage);

  const handleAccept = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/proposals/${proposal.id}/accept`, {
        method: 'POST',
      });
      if (res.ok) {
        setStatus('accepted');
        addMessage({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Applied the change. ${proposal.explanation}`,
          timestamp: Date.now(),
        });
      } else {
        const err = await res.json();
        setStatus('rejected');
        addMessage({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Could not apply: ${err.error || 'Unknown error'}`,
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      addMessage({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Error applying change: ${(e as Error).message}`,
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  }, [proposal, addMessage]);

  const handleReject = useCallback(() => {
    setStatus('rejected');
    fetch(`/api/ai/proposals/${proposal.id}/reject`, { method: 'POST' }).catch(() => {});
    addMessage({
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: 'Proposal rejected.',
      timestamp: Date.now(),
    });
  }, [proposal, addMessage]);

  const typeLabel = proposal.changeType === 'replace' ? 'Replace' : proposal.changeType === 'insert' ? 'Insert' : 'Delete';
  const confidencePercent = Math.round(proposal.confidence * 100);

  return (
    <div className="rounded-xl border border-theme-border bg-theme-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-theme-border bg-theme-hover/50">
        <div className="flex items-center gap-2">
          <FileDiff className="h-3.5 w-3.5 text-theme-accent" />
          <span className="text-xs font-medium text-theme-main">{typeLabel} proposal</span>
          <span className="text-[10px] text-theme-muted bg-theme-hover px-1.5 py-0.5 rounded">
            {confidencePercent}% confidence
          </span>
        </div>
        {status === 'pending' && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleAccept}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md bg-green-500/10 text-green-600 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Accept
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
            >
              <X className="h-3 w-3" />
              Reject
            </button>
          </div>
        )}
        {status === 'accepted' && (
          <span className="text-[11px] text-green-600 bg-green-500/10 px-2 py-0.5 rounded font-medium">Applied</span>
        )}
        {status === 'rejected' && (
          <span className="text-[11px] text-theme-muted bg-theme-hover px-2 py-0.5 rounded">Rejected</span>
        )}
      </div>

      {/* Explanation */}
      <div className="px-3 py-2">
        <p className="text-xs text-theme-subtle leading-relaxed">{proposal.explanation}</p>
      </div>

      {/* Diff toggle */}
      {(proposal.originalContent || proposal.proposedContent) && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] text-theme-muted hover:text-theme-main hover:bg-theme-hover border-t border-theme-border transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Hide' : 'Show'} diff
          </button>

          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="border-t border-theme-border overflow-hidden"
            >
              <div className="max-h-48 overflow-y-auto font-mono text-[11px] leading-relaxed">
                {proposal.originalContent && proposal.changeType !== 'insert' && (
                  <div className="px-3 py-2 bg-red-500/5">
                    <div className="text-[10px] text-red-500 mb-1 font-sans font-medium">Removed</div>
                    <pre className="whitespace-pre-wrap text-red-600/80">{proposal.originalContent}</pre>
                  </div>
                )}
                {proposal.proposedContent && proposal.changeType !== 'delete' && (
                  <div className="px-3 py-2 bg-green-500/5">
                    <div className="text-[10px] text-green-500 mb-1 font-sans font-medium">Added</div>
                    <pre className="whitespace-pre-wrap text-green-600/80">{proposal.proposedContent}</pre>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
