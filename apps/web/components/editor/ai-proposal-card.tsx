'use client';

import { useState } from 'react';
import {
  Check, X, ChevronDown, ChevronUp, Sparkles,
  AlertTriangle, Loader2, Replace, Plus, Trash2,
} from 'lucide-react';
import { DiffViewer } from '@/components/diff-viewer';

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

interface AIProposalCardProps {
  proposal: Proposal;
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

const CHANGE_TYPE_CONFIG = {
  replace: { icon: Replace, label: 'Replace', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  insert: { icon: Plus, label: 'Insert', color: 'text-green-500', bg: 'bg-green-500/10' },
  delete: { icon: Trash2, label: 'Delete', color: 'text-red-500', bg: 'bg-red-500/10' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  accepted: { label: 'Accepted', color: 'text-green-500', bg: 'bg-green-500/10' },
  rejected: { label: 'Rejected', color: 'text-red-500', bg: 'bg-red-500/10' },
};

export function AIProposalCard({ proposal, onAccept, onReject }: AIProposalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const changeConfig = CHANGE_TYPE_CONFIG[proposal.changeType];
  const statusConfig = STATUS_CONFIG[proposal.status];
  const ChangeIcon = changeConfig.icon;

  async function handleAccept() {
    setLoading(true);
    try {
      await onAccept(proposal.id);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    try {
      await onReject(proposal.id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`rounded-lg border transition-colors ${
      proposal.status === 'pending'
        ? 'border-theme-border bg-theme-card hover:border-theme-accent/30'
        : proposal.status === 'accepted'
        ? 'border-green-500/20 bg-green-500/5'
        : 'border-red-500/20 bg-red-500/5'
    }`}>
      {/* Header */}
      <div className="px-3 py-2.5">
        <div className="flex items-start gap-2">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${changeConfig.bg}`}>
            <ChangeIcon className={`w-3 h-3 ${changeConfig.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-theme-main">
                {changeConfig.label}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              {proposal.source === 'health' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-theme-accent/10 text-theme-accent font-medium">
                  Health
                </span>
              )}
            </div>
            <p className="text-[11px] text-theme-muted mt-0.5 line-clamp-2">
              {proposal.explanation}
            </p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-theme-muted hover:text-theme-subtle hover:bg-theme-hover transition-colors shrink-0"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Confidence bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-theme-hover overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                proposal.confidence >= 0.8 ? 'bg-green-500' :
                proposal.confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${proposal.confidence * 100}%` }}
            />
          </div>
          <span className="text-[9px] text-theme-muted">
            {Math.round(proposal.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Expanded diff */}
      {expanded && (
        <div className="border-t border-theme-border px-3 py-2.5">
          {proposal.changeType === 'delete' ? (
            <div className="rounded-md bg-red-500/5 border border-red-500/20 p-2">
              <p className="text-[10px] text-red-500 font-medium mb-1">Will be removed:</p>
              <p className="text-[11px] text-theme-subtle font-mono whitespace-pre-wrap line-through">
                {proposal.originalContent.slice(0, 500)}
                {proposal.originalContent.length > 500 ? '...' : ''}
              </p>
            </div>
          ) : (
            <DiffViewer
              oldText={proposal.originalContent || '(empty)'}
              newText={proposal.proposedContent}
              oldLabel="Current"
              newLabel="Proposed"
            />
          )}
        </div>
      )}

      {/* Actions */}
      {proposal.status === 'pending' && (
        <div className="flex items-center gap-1.5 px-3 py-2 border-t border-theme-border">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1 rounded-md bg-theme-accent px-3 py-1.5 text-[11px] font-medium text-white hover:bg-theme-accent-hover disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Apply Fix
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1 rounded-md border border-theme-border px-3 py-1.5 text-[11px] font-medium text-theme-subtle hover:bg-theme-hover disabled:opacity-50 transition-colors"
          >
            <X className="w-3 h-3" />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
