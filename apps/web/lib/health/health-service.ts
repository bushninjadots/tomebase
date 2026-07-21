import type { Diagnostic, DiagnosticScanResult, HealthScore } from '@fluid/types';
import { eventBus } from '@/lib/events';
import type { EventName, EventBusEvents } from '@/lib/events/types';

interface PageDiagnostics {
  pageId: string;
  diagnostics: Diagnostic[];
  lastScannedAt: number;
}

type FetchFn = (input: string | Request | URL, init?: RequestInit) => Promise<Response>;

interface HealthServiceConfig {
  debounceMs?: number;
  fetcher?: FetchFn;
}

function defaultFetcher(input: string | Request | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, init);
}

export class HealthService {
  private pageCache = new Map<string, PageDiagnostics>();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private projectId: string | null = null;
  private destroyFns: Array<() => void> = [];
  private debounceMs: number;
  private fetcher: FetchFn;
  private rescanInFlight = false;
  private previousScore: number | null = null;
  private lastScannedAt: string | null = null;

  constructor(config: HealthServiceConfig = {}) {
    this.debounceMs = config.debounceMs ?? 2000;
    this.fetcher = config.fetcher ?? defaultFetcher;
  }

  attach(projectId: string) {
    this.detach();
    this.projectId = projectId;
    this.pageCache.clear();
    this.previousScore = null;
    this.lastScannedAt = null;
    this.subscribeToEvents();
  }

  detach() {
    for (const fn of this.destroyFns) fn();
    this.destroyFns = [];
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.pageCache.clear();
    this.projectId = null;
  }

  getPageDiagnostics(pageId: string): Diagnostic[] {
    return this.pageCache.get(pageId)?.diagnostics ?? [];
  }

  getAllPageDiagnostics(): PageDiagnostics[] {
    return Array.from(this.pageCache.values());
  }

  invalidatePage(pageId: string) {
    this.pageCache.delete(pageId);
    this.scheduleRescan();
  }

  invalidateProject() {
    this.pageCache.clear();
    this.scheduleRescan();
  }

  async rescan(): Promise<DiagnosticScanResult | null> {
    if (!this.projectId || this.rescanInFlight) return null;

    this.rescanInFlight = true;
    try {
      const prevScore = this.previousScore;

      const res = await this.fetcher(
        `/api/projects/${this.projectId}/diagnostics`,
      );
      if (!res.ok) return null;

      const result: DiagnosticScanResult = await res.json();
      this.rebuildCache(result);

      this.previousScore = result.healthScore.score;
      this.lastScannedAt = result.scannedAt;

      eventBus.emit('health:scanned', {
        projectId: this.projectId,
        score: result.healthScore.score,
        previousScore: prevScore,
      });

      if (prevScore !== null && prevScore !== result.healthScore.score) {
        eventBus.emit('health:scoreChanged', {
          projectId: this.projectId,
          previousScore: prevScore,
          newScore: result.healthScore.score,
        });
      }

      return result;
    } catch {
      return null;
    } finally {
      this.rescanInFlight = false;
    }
  }

  private rebuildCache(result: DiagnosticScanResult) {
    this.pageCache.clear();
    for (const d of result.diagnostics) {
      const existing = this.pageCache.get(d.pageId);
      if (existing) {
        existing.diagnostics.push(d);
      } else {
        this.pageCache.set(d.pageId, {
          pageId: d.pageId,
          diagnostics: [d],
          lastScannedAt: Date.now(),
        });
      }
    }
  }

  private scheduleRescan() {
    if (!this.projectId) return;
    const key = this.projectId;

    const existing = this.debounceTimers.get(key);
    if (existing) clearTimeout(existing);

    this.debounceTimers.set(
      key,
      setTimeout(() => {
        this.debounceTimers.delete(key);
        this.rescan();
      }, this.debounceMs),
    );
  }

  private subscribeToEvents() {
    const off1 = eventBus.on('page:updated', (payload) => {
      if (payload.projectId !== this.projectId) return;
      this.invalidatePage(payload.pageId);
    });

    const off2 = eventBus.on('page:created', (payload) => {
      if (payload.projectId !== this.projectId) return;
      this.scheduleRescan();
    });

    const off3 = eventBus.on('page:deleted', (payload) => {
      if (payload.projectId !== this.projectId) return;
      this.pageCache.delete(payload.pageId);
      this.scheduleRescan();
    });

    const off4 = eventBus.on('diagnostic:fixed', (payload) => {
      if (payload.projectId !== this.projectId) return;
      this.invalidatePage(payload.pageId);
    });

    const off5 = eventBus.on('document:saved', (payload) => {
      this.invalidatePage(payload.pageId);
    });

    const off6 = eventBus.on('import:completed', (payload) => {
      if (payload.projectId !== this.projectId) return;
      this.invalidateProject();
    });

    const off7 = eventBus.on('page:published', (payload) => {
      if (payload.projectId !== this.projectId) return;
      this.scheduleRescan();
    });

    const off8 = eventBus.on('page:unpublished', (payload) => {
      if (payload.projectId !== this.projectId) return;
      this.scheduleRescan();
    });

    this.destroyFns.push(off1, off2, off3, off4, off5, off6, off7, off8);
  }
}

let singleton: HealthService | null = null;

export function getHealthService(config?: HealthServiceConfig): HealthService {
  if (!singleton) {
    singleton = new HealthService(config);
  }
  return singleton;
}

export function resetHealthService() {
  if (singleton) {
    singleton.detach();
    singleton = null;
  }
}
