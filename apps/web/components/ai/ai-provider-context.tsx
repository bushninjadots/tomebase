'use client';

import { createContext, useState, useEffect, useCallback } from 'react';
import type { StoredAIProviderConfig } from '@/lib/ai-provider/types';

export interface TestConnectionResult {
  success: boolean;
  message: string;
  model?: string;
}

export interface AIProviderContextType {
  configs: StoredAIProviderConfig[];
  activeProvider: StoredAIProviderConfig | null;
  loading: boolean;
  error: string | null;
  refreshConfigs: () => Promise<void>;
  saveProvider: (data: {
    provider: string;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  }) => Promise<void>;
  deleteProvider: (provider: string) => Promise<void>;
  testConnection: (data: {
    provider: string;
    apiKey: string;
    baseUrl?: string;
    model?: string;
  }) => Promise<TestConnectionResult>;
  chat: (request: {
    content: string;
    operation?: string;
    pageId?: string;
    messages?: Array<{ role: string; content: string }>;
  }) => Promise<any>;
}

export const AIProviderContext = createContext<AIProviderContextType | null>(null);

export function AIProviderProvider({ children }: { children: React.ReactNode }) {
  const [configs, setConfigs] = useState<StoredAIProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeProvider =
    configs.find((c) => c.enabled) ?? configs[0] ?? null;

  const refreshConfigs = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/ai/providers');
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Failed to load AI providers');
      }
      const data = await res.json();
      setConfigs(Array.isArray(data) ? data : data.configs ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load AI providers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfigs();
  }, [refreshConfigs]);

  const saveProvider = useCallback(
    async (data: {
      provider: string;
      apiKey?: string;
      model?: string;
      baseUrl?: string;
    }) => {
      setError(null);
      const res = await fetch('/api/ai/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to save provider');
      }

      await refreshConfigs();
    },
    [refreshConfigs],
  );

  const deleteProvider = useCallback(
    async (provider: string) => {
      setError(null);
      const res = await fetch('/api/ai/providers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to delete provider');
      }

      await refreshConfigs();
    },
    [refreshConfigs],
  );

  const testConnection = useCallback(
    async (data: {
      provider: string;
      apiKey: string;
      baseUrl?: string;
      model?: string;
    }): Promise<TestConnectionResult> => {
      try {
        setError(null);
        const res = await fetch('/api/ai/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          return {
            success: false,
            message: body?.error ?? 'Connection test failed',
          };
        }

        return await res.json();
      } catch (err: any) {
        return {
          success: false,
          message: err.message ?? 'Connection test failed',
        };
      }
    },
    [],
  );

  const chat = useCallback(
    async (request: {
      content: string;
      operation?: string;
      pageId?: string;
      messages?: Array<{ role: string; content: string }>;
    }) => {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'AI request failed');
      }

      return res.json();
    },
    [],
  );

  return (
    <AIProviderContext.Provider
      value={{
        configs,
        activeProvider,
        loading,
        error,
        refreshConfigs,
        saveProvider,
        deleteProvider,
        testConnection,
        chat,
      }}
    >
      {children}
    </AIProviderContext.Provider>
  );
}
