'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Sparkles, Loader2, X, Bot, User, Copy, Check,
  AlertTriangle, Lightbulb,
} from 'lucide-react';
import { useAI } from '@/components/ai/use-ai';
import { AIProposalCard } from './ai-proposal-card';

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

interface AIPanelProps {
  pageId?: string;
  projectId?: string;
  pageTitle?: string;
  pageContent?: string;
  onClose?: () => void;
  onContentUpdate?: (newContent: string) => void;
}

export function AIPanel({ pageId, projectId, pageTitle, pageContent, onClose, onContentUpdate }: AIPanelProps) {
  const { activeProvider, chat } = useAI();
  const [messages, setMessages] = useState<Message[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchProposals = useCallback(async () => {
    if (!pageId) return;
    try {
      const res = await fetch(`/api/ai/proposals?pageId=${pageId}&status=pending`);
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals);
      }
    } catch {
      // silently fail
    }
  }, [pageId]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, proposals]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const quickActions = [
    { label: 'Explain this page', prompt: `Explain this documentation page: "${pageTitle}"`, icon: '📖' },
    { label: 'Suggest improvements', prompt: 'suggest', icon: '✨', isPropose: true },
    { label: 'Summarize', prompt: `Summarize this documentation page in 3 bullet points`, icon: '📝' },
    { label: 'Review quality', prompt: `Review this documentation for quality, clarity, and completeness`, icon: '🔍' },
  ];

  async function handleSend(text?: string) {
    const question = text || input.trim();
    if (!question || loading || proposing) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);
    setStreamingContent('');
    setError(null);

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

  async function handlePropose(instruction?: string) {
    const text = instruction || input.trim();
    if (!text || !pageId || proposing) return;
    setInput('');
    setProposing(true);
    setError(null);

    setMessages((prev) => [...prev, { role: 'user', content: text }]);

    try {
      const res = await fetch('/api/ai/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, instruction: text }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || 'Failed to generate proposal';
        setError(errMsg);
        setMessages((prev) => [...prev, { role: 'assistant', content: `Could not generate a proposal: ${errMsg}` }]);
        return;
      }

      if (data.proposal) {
        setProposals((prev) => [data.proposal, ...prev]);
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: `Created a ${data.proposal.changeType} proposal: ${data.proposal.explanation}`,
        }]);
      }
    } catch {
      setError('Network error — could not generate proposal');
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Network error — could not generate proposal.' }]);
    } finally {
      setProposing(false);
    }
  }

  async function handleAcceptProposal(id: string) {
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
      setProposals((prev) => prev.filter((p) => p.id !== id));
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Applied the change to your document.' }]);
    } catch {
      setError('Network error — could not apply proposal');
    }
  }

  async function handleRejectProposal(id: string) {
    try {
      await fetch(`/api/ai/proposals/${id}/reject`, { method: 'POST' });
      setProposals((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('Network error — could not reject proposal');
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (e.altKey || e.metaKey) {
        handlePropose();
      } else {
        handleSend();
      }
    }
  }

  const busy = loading || proposing;

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

      {/* Messages + Proposals */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Empty state: quick actions */}
        {messages.length === 0 && proposals.length === 0 && !busy && (
          <div className="space-y-2 pt-4">
            <p className="text-xs text-theme-muted text-center mb-3">What can I help with?</p>
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => action.isPropose ? handlePropose('suggest improvements for this page') : handleSend(action.prompt)}
                className="w-full text-left px-3 py-2.5 rounded-lg border border-theme-border bg-theme-card hover:border-theme-accent/30 hover:bg-theme-hover transition-all text-xs text-theme-subtle"
              >
                <span className="mr-1.5">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Pending proposals banner */}
        {proposals.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] text-theme-accent font-medium">
              <Lightbulb className="w-3 h-3" />
              {proposals.length} pending proposal{proposals.length !== 1 ? 's' : ''}
            </div>
            {proposals.map((proposal) => (
              <AIProposalCard
                key={proposal.id}
                proposal={proposal}
                onAccept={handleAcceptProposal}
                onReject={handleRejectProposal}
              />
            ))}
          </div>
        )}

        {/* Chat messages */}
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

        {/* Streaming response */}
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

        {/* Loading / thinking */}
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

        {/* Proposing indicator */}
        {proposing && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-theme-accent/10 flex items-center justify-center shrink-0">
              <Loader2 className="w-3 h-3 text-theme-accent animate-spin" />
            </div>
            <div className="rounded-xl bg-theme-card border border-theme-border px-3 py-2 text-xs text-theme-muted">
              Generating proposal...
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-1.5 rounded-md bg-red-500/5 border border-red-500/20 px-2.5 py-1.5">
            <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
            <p className="text-[10px] text-red-500 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-[10px]">&times;</button>
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
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Alt+Enter to propose)"
            rows={1}
            className="flex-1 resize-none rounded-lg border border-theme-border bg-theme-page px-3 py-2 text-xs text-theme-main placeholder:text-theme-muted/50 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent/30"
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || busy}
              className="p-2 rounded-lg bg-theme-accent text-gray-900 hover:bg-theme-accent-hover transition-colors disabled:opacity-40"
              title="Send (Enter)"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePropose()}
              disabled={!input.trim() || busy || !pageId}
              className="p-2 rounded-lg border border-theme-border bg-theme-card text-theme-accent hover:bg-theme-hover transition-colors disabled:opacity-40"
              title="Propose change (Alt+Enter)"
            >
              <Lightbulb className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-[9px] text-theme-muted mt-1.5 text-center">
          Enter to chat · Alt+Enter to propose a change
        </p>
      </div>
    </div>
  );
}
