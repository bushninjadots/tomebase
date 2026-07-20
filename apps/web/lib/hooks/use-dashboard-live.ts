'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { eventBus } from '@/lib/events';
import type { EventName } from '@/lib/events/types';
import type { DashboardData } from '@/app/api/dashboard/route';

const REFETCH_EVENTS: EventName[] = [
  'page:created',
  'page:updated',
  'page:deleted',
  'page:moved',
  'page:published',
  'page:unpublished',
  'project:published',
  'project:unpublished',
  'project:deleted',
  'health:scanned',
  'health:scoreChanged',
  'import:completed',
  'document:saved',
  'document:restored',
];

const VIEW_POLL_MS = 30_000;
const DEBOUNCE_MS = 500;

export interface UseDashboardLiveResult {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDashboardLive(): UseDashboardLiveResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard');
      const json = await res.json();
      if (mountedRef.current) {
        setData(json);
        setError(null);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchData();
    }, DEBOUNCE_MS);
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    const unsubscribers = REFETCH_EVENTS.map((eventName) =>
      eventBus.on(eventName, () => {
        debouncedRefresh();
      })
    );

    const viewPoll = setInterval(() => {
      fetchData();
    }, VIEW_POLL_MS);

    return () => {
      mountedRef.current = false;
      for (const unsub of unsubscribers) unsub();
      clearInterval(viewPoll);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchData, debouncedRefresh]);

  return { data, loading, error, refresh: fetchData };
}
