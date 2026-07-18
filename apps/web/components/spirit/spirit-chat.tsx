'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Trash2,
  StopCircle,
  ChevronDown,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useSpiritStore } from '@fluid/spirit';
import type { SpiritMessage } from '@fluid/spirit';
import { useAI } from '@/components/ai/use-ai';

interface SpiritChatProps {
  projectId?: string;
  pageId?: string;
}

export function SpiritChat({ projectId, pageId }: SpiritChatProps) {
  const {
    conversations,
    activeConversationId,
    addMessage,
    updateLastMessage,
    setActiveConversation,
    createConversation,
    aiState,
    setAIState,
    context,
  } = useSpiritStore();

  const { activeProvider, chat } = useAI();
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = useMemo(() => activeConversation?.messages ?? [], [activeConversation?.messages]);

  // Resolve context: prefer explicit props, fall back to store context
  const resolvedPageId = pageId || context.currentPage?.id || undefined;
  const resolvedProjectId = projectId || undefined;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages.length]);

  // Auto-create conversation
  useEffect(() => {
    if (!activeConversationId && conversations.length === 0) {
      createConversation();
    }
  }, [activeConversationId, conversations.length, createConversation]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation();
    }

    // Build context-enriched message
    const contextParts: string[] = [];
    if (context.currentPage) {
      contextParts.push(`Page: "${context.currentPage.title}" (slug: ${context.currentPage.slug})`);
    }
    if (context.currentSelection) {
      contextParts.push(`Selected text: "${context.currentSelection}"`);
    }
    if (context.currentFolder) {
      contextParts.push(`Folder: ${context.currentFolder}`);
    }

    const userMessage: SpiritMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addMessage(userMessage);

    const assistantId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const placeholder: SpiritMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    addMessage(placeholder);

    setAIState('thinking');
    abortRef.current = new AbortController();

    try {
      // Build message history for multi-turn context
      const messageHistory = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: text },
      ];

      // Try streaming first for premium feel
      const streamRes = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          pageId: resolvedPageId,
          projectId: resolvedProjectId,
          operation: 'chat',
          messages: messageHistory,
          selectedText: context.currentSelection || undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (streamRes.ok && streamRes.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = streamRes.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let fullContent = '';
          setAIState('responding');

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.error) throw new Error(parsed.error);
                  if (parsed.content) {
                    fullContent += parsed.content;
                    updateLastMessage(fullContent);
                  }
                } catch {
                  // Skip malformed lines
                }
              }
            }
          }

          setAIState('idle');
          abortRef.current = null;
          return;
        }
      }

      // Fallback to non-streaming via centralized chat()
      setAIState('thinking');
      const data = await chat({
        content: text,
        operation: 'chat',
        pageId: resolvedPageId,
        projectId: resolvedProjectId,
        pageTitle: context.currentPage?.title,
        selectedText: context.currentSelection || undefined,
        messages: messageHistory,
      });

      const content = data.content || data.message || data.explanation || 'No response';
      updateLastMessage(content);
      setAIState('idle');
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setAIState('idle');
      } else {
        updateLastMessage(`Error: ${(err as Error).message}`);
        setAIState('error');
      }
    }
  }, [
    input, activeConversationId, createConversation, addMessage, updateLastMessage,
    setAIState, chat, messages, context, resolvedPageId, resolvedProjectId,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setAIState('idle');
  }, [setAIState]);

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isStreaming = aiState === 'thinking' || aiState === 'responding';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-theme-accent" />
          <span className="text-sm font-semibold text-theme-main">Tome Spirit</span>
          {activeProvider ? (
            <span className="flex items-center gap-1 text-[10px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded font-medium">
              <Wifi className="h-2.5 w-2.5" />
              {activeProvider.provider}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-theme-muted bg-theme-hover px-1.5 py-0.5 rounded font-medium">
              <WifiOff className="h-2.5 w-2.5" />
              Offline
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {context.currentPage && (
            <span className="text-[10px] text-theme-muted bg-theme-hover px-1.5 py-0.5 rounded max-w-[120px] truncate">
              {context.currentPage.title}
            </span>
          )}
          <button
            onClick={() => {
              const id = createConversation();
              setActiveConversation(id);
            }}
            className="p-1.5 rounded-md text-theme-muted hover:bg-theme-hover hover:text-theme-main transition-colors"
            title="New conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Sparkles className="h-8 w-8 text-theme-accent/30 mb-3" />
            <p className="text-sm text-theme-muted max-w-[200px]">
              Ask me anything about your documentation.
            </p>
            {!activeProvider && (
              <a
                href="/dashboard/account/ai"
                className="mt-3 text-xs text-theme-accent hover:underline"
              >
                Configure an AI provider
              </a>
            )}
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-theme-accent text-gray-900'
                    : 'bg-theme-hover text-theme-main'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content || (msg.isStreaming ? '...' : '')}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}

                {/* Copy button */}
                {msg.role === 'assistant' && msg.content && !msg.isStreaming && (
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="mt-2 inline-flex items-center gap-1 text-[10px] text-theme-muted hover:text-theme-main transition-colors"
                  >
                    {copiedId === msg.id ? (
                      <><Check className="h-3 w-3 text-green-500" /> Copied</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copy</>
                    )}
                  </button>
                )}

                {msg.isStreaming && !msg.content && (
                  <div className="flex items-center gap-1.5 py-1">
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full bg-theme-accent"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full bg-theme-accent"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, delay: 0.2, repeat: Infinity }}
                    />
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full bg-theme-accent"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, delay: 0.4, repeat: Infinity }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-theme-border p-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeProvider ? 'Ask the Spirit...' : 'Configure AI provider to chat'}
            rows={1}
            disabled={!activeProvider}
            className="flex-1 bg-theme-hover rounded-xl px-3.5 py-2.5 text-sm text-theme-main placeholder-theme-muted outline-none resize-none border border-theme-border focus:border-theme-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: 38, maxHeight: 120 }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />
          <div className="flex items-center gap-1">
            {isStreaming ? (
              <button
                onClick={handleStop}
                className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                title="Stop"
              >
                <StopCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() || !activeProvider}
                className="p-2 rounded-xl bg-theme-accent text-gray-900 hover:bg-theme-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
