'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Sparkles, Loader2, X, Bot, User, Copy, Check,
  RefreshCw, AlertTriangle, Inbox,
} from 'lucide-react';
import { useAI } from '@/components/ai/use-ai';
import { AIProposalCard } from './ai-proposal-card';

type AIPanelTab = 'chat' | 'suggest';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

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

interface AIPanelProps {
  pageId?: string;
  projectId?: string;
  pageTitle?: string;
  pageContent?: string;
  onClose?: () => void;
  onContentUpdate?: (newContent: string) => void;
}

export function AIPanel({ pageId, projectId, pageTitle, pageContent, onClose, onContentUpdate }: AIPanelProps) {
  const { activeProvider } = useAI();
  const [activeTab, setActiveTab] = useState<AIPanelTab>('chat');

  if (!activeProvider) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-theme-accent/10 flex items-center justify-center mb-4">
          <Bot className="w-6 h-6 text-theme-accent" />
        </div>
        <h3 className="text-sm font-semibold text-theme-main mb-1">No AI Provider</h3>
        <p className="text-xs text-theme-muted mb-4 max-w-[200px]">
          Connect an AI provider to use the AI assistant.
        </p>
        <a
          href="/dashboard/account/ai"
          className="rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors"
        >
          Configure AI
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-theme-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-theme-accent" />
          <span className="text-sm font-semibold text-theme-main">AI</span>
          <span className="text-[10px] text-theme-muted bg-theme-hover px-1.5 py-0.5 rounded">
            {activeProvider.provider}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded text-theme-muted hover:bg-theme-hover transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-theme-border">
        {([
          { id: 'chat' as AIPanelTab, label: 'Chat' },
          { id: 'suggest' as AIPanelTab, label: 'Suggest' },
        ]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === id
                ? 'text-theme-accent border-theme-accent'
                : 'text-theme-muted border-transparent hover:text-theme-subtle'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <ChatTab
            pageId={pageId}
            projectId={projectId}
            pageTitle={pageTitle}
            pageContent={pageContent}
          />
        )}
        {activeTab === 'suggest' && (
          <SuggestTab
            pageId={pageId}
            pageTitle={pageTitle}
            onContentUpdate={onContentUpdate}
          />
        )}
      </div>
    </div>
  );
}

/* ── Chat Tab ───────────────────────────────────────────── */

function ChatTab({ pageId, projectId, pageTitle, pageContent }: {
  pageId?: string;
  projectId?: string;
  pageTitle?: string;
  pageContent?: string;
}) {
  const { chat } = useAI();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const quickActions = [
    { label: 'Explain', prompt: `Explain this documentation page: "${pageTitle}"`, icon: '📖' },
    { label: 'Improve', prompt: `Suggest improvements for this documentation page: "${pageTitle}"`, icon: '✨' },
    { label: 'Summarize', prompt: `Summarize this documentation page in 3 bullet points`, icon: '📝' },
    { label: 'Review', prompt: `Review this documentation for quality, clarity, and completeness`, icon: '🔍' },
  ];

  async function handleSend(text?: string) {
    const question = text || input.trim();
    if (!question || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);
    setStreamingContent('');

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: question,
          pageContent: pageContent || '',
          operation: 'chat',
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: question },
          ],
          pageId,
          projectId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'AI request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              }
            } catch {
              // Skip malformed lines
            }
          }
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: fullContent }]);
      setStreamingContent('');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStreamingContent('');
        return;
      }

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: pageContent || '',
            operation: 'chat',
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: 'user', content: question },
            ],
            pageId,
            projectId,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'AI request failed');
        }

        const data = await response.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content || data.message || 'No response' }]);
      } catch (fallbackError) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}` },
        ]);
      }
    } finally {
      setLoading(false);
      setStreamingContent('');
      abortRef.current = null;
    }
  }

  function cancelStream() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setLoading(false);
      setStreamingContent('');
    }
  }

  function copyMessage(content: string, idx: number) {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="space-y-2 pt-4">
            <p className="text-xs text-theme-muted text-center mb-3">Quick actions</p>
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleSend(action.prompt)}
                className="w-full text-left px-3 py-2.5 rounded-lg border border-theme-border bg-theme-card hover:border-theme-accent/30 hover:bg-theme-hover transition-all text-xs text-theme-subtle"
              >
                <span className="mr-1.5">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-theme-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-theme-accent" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-theme-accent/10 text-theme-main'
                  : 'bg-theme-card border border-theme-border text-theme-subtle'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => copyMessage(msg.content, idx)}
                  className="mt-1.5 flex items-center gap-1 text-[10px] text-theme-muted hover:text-theme-subtle transition-colors"
                >
                  {copiedIdx === idx ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                  {copiedIdx === idx ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-theme-hover flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3 h-3 text-theme-muted" />
              </div>
            )}
          </div>
        ))}

        {loading && streamingContent && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-theme-accent/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3 h-3 text-theme-accent" />
            </div>
            <div className="max-w-[85%] rounded-xl bg-theme-card border border-theme-border px-3 py-2 text-xs text-theme-subtle">
              <div className="whitespace-pre-wrap break-words">{streamingContent}</div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-theme-muted">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Streaming...
              </div>
            </div>
          </div>
        )}

        {loading && !streamingContent && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-theme-accent/10 flex items-center justify-center shrink-0">
              <Loader2 className="w-3 h-3 text-theme-accent animate-spin" />
            </div>
            <div className="rounded-xl bg-theme-card border border-theme-border px-3 py-2 text-xs text-theme-muted">
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-theme-border">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-theme-border bg-theme-page px-3 py-2 text-xs text-theme-main placeholder:text-theme-muted/50 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent/30"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="shrink-0 p-2 rounded-lg bg-theme-accent text-gray-900 hover:bg-theme-accent-hover transition-colors disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Suggest Tab ────────────────────────────────────────── */

function SuggestTab({ pageId, pageTitle, onContentUpdate }: {
  pageId?: string;
  pageTitle?: string;
  onContentUpdate?: (newContent: string) => void;
}) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<ProposalStats>({ pending: 0, accepted: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  const fetchProposals = useCallback(async () => {
    if (!pageId) return;
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
    if (!instruction.trim() || !pageId) return;
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
      {/* Input */}
      <div className="px-3 py-2.5 border-b border-theme-border">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
            placeholder="e.g. Add installation instructions..."
            className="flex-1 rounded-md border border-theme-border bg-theme-page px-2.5 py-1.5 text-[11px] text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent/20"
            disabled={generating}
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !instruction.trim()}
            className="rounded-md bg-theme-accent px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-theme-accent-hover disabled:opacity-50 transition-colors flex items-center gap-1"
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
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

        {stats.total > 0 && (
          <p className="text-[10px] text-theme-muted mt-1.5">
            {stats.pending} pending · {stats.accepted} accepted · {stats.rejected} rejected
          </p>
        )}
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
            <Loader2 className="w-4 h-4 animate-spin text-theme-muted" />
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
