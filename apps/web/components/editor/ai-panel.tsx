'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, X, Bot, User, Copy, Check } from 'lucide-react';
import { useAI } from '@/components/ai/use-ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIPanelProps {
  pageId?: string;
  pageTitle?: string;
  pageContent?: string;
  onClose?: () => void;
}

export function AIPanel({ pageId, pageTitle, pageContent, onClose }: AIPanelProps) {
  const { activeProvider, chat } = useAI();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'AI request failed');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.content || data.message || 'No response' }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function copyMessage(content: string, idx: number) {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  if (!activeProvider) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-theme-accent/10 flex items-center justify-center mb-4">
          <Bot className="w-6 h-6 text-theme-accent" />
        </div>
        <h3 className="text-sm font-semibold text-theme-main mb-1">No AI Provider</h3>
        <p className="text-xs text-theme-muted mb-4 max-w-[200px]">
          Connect an AI provider to use the chat assistant.
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-theme-accent" />
          <span className="text-sm font-semibold text-theme-main">AI Assistant</span>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
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

        {loading && (
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
