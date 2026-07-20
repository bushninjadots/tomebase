import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HealthService, getHealthService, resetHealthService } from './health-service';
import { eventBus } from '@/lib/events';
import { useProjectStore, selectHealth, selectHealthScore } from '@/lib/stores/project-store';
import type { DiagnosticScanResult } from '@fluid/types';

const mockScanResult: DiagnosticScanResult = {
  diagnostics: [
    {
      id: 'd1',
      category: 'broken_link',
      severity: 'error',
      title: 'Broken link',
      description: 'Link to /missing-page is broken',
      explanation: 'The link points to a page that does not exist.',
      pageId: 'page1',
      pageSlug: 'page-1',
      pageTitle: 'Page 1',
      line: 5,
      column: 1,
      rule: 'broken-link',
      canAutoFix: false,
      fixPreview: null,
      aiAvailable: false,
      ignored: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'd2',
      category: 'trailing_whitespace',
      severity: 'warning',
      title: 'Trailing whitespace',
      description: 'Line has trailing whitespace',
      explanation: 'Trailing whitespace should be removed for clean formatting.',
      pageId: 'page1',
      pageSlug: 'page-1',
      pageTitle: 'Page 1',
      line: 10,
      column: 1,
      rule: 'trailing-whitespace',
      canAutoFix: true,
      fixPreview: {
        originalContent: 'line  ',
        fixedContent: 'line',
        description: 'Remove trailing whitespace',
        confidence: 'high',
      },
      aiAvailable: false,
      ignored: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'd3',
      category: 'missing_description',
      severity: 'info',
      title: 'Missing description',
      description: 'Page has no description',
      explanation: 'A description helps with SEO and discoverability.',
      pageId: 'page2',
      pageSlug: 'page-2',
      pageTitle: 'Page 2',
      line: null,
      column: null,
      rule: 'missing-description',
      canAutoFix: false,
      fixPreview: null,
      aiAvailable: false,
      ignored: false,
      createdAt: new Date().toISOString(),
    },
  ],
  healthScore: {
    score: 75,
    grade: 'B',
    label: 'Good',
    color: 'green',
    errorCount: 1,
    warningCount: 1,
    infoCount: 1,
    totalIssues: 3,
    fixableCount: 1,
    categoryBreakdown: [],
  },
  scannedAt: new Date().toISOString(),
  totalPages: 5,
  scanDuration: 42,
};

function createMockFetcher(result: DiagnosticScanResult) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(result),
  });
}

function createFailingFetcher() {
  return vi.fn().mockResolvedValue({ ok: false });
}

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    resetHealthService();
    eventBus.removeAllListeners();
    useProjectStore.getState().reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    if (service) service.detach();
    resetHealthService();
    eventBus.removeAllListeners();
  });

  it('creates singleton instance', () => {
    const s1 = getHealthService();
    const s2 = getHealthService();
    expect(s1).toBe(s2);
    resetHealthService();
  });

  it('attaches to a project and subscribes to events', () => {
    service = new HealthService({ fetcher: createMockFetcher(mockScanResult) });
    service.attach('proj1');

    expect(eventBus.listenerCount('page:updated')).toBeGreaterThan(0);
    expect(eventBus.listenerCount('page:created')).toBeGreaterThan(0);
    expect(eventBus.listenerCount('page:deleted')).toBeGreaterThan(0);
    expect(eventBus.listenerCount('diagnostic:fixed')).toBeGreaterThan(0);
    expect(eventBus.listenerCount('document:saved')).toBeGreaterThan(0);
    expect(eventBus.listenerCount('import:completed')).toBeGreaterThan(0);
    expect(eventBus.listenerCount('page:published')).toBeGreaterThan(0);
    expect(eventBus.listenerCount('page:unpublished')).toBeGreaterThan(0);
  });

  it('detaches and removes all listeners', () => {
    service = new HealthService({ fetcher: createMockFetcher(mockScanResult) });
    service.attach('proj1');
    service.detach();

    expect(eventBus.listenerCount('page:updated')).toBe(0);
    expect(eventBus.listenerCount('page:created')).toBe(0);
  });

  it('returns empty diagnostics for unknown page', () => {
    service = new HealthService({ fetcher: createMockFetcher(mockScanResult) });
    service.attach('proj1');

    expect(service.getPageDiagnostics('nonexistent')).toEqual([]);
  });

  it('invalidates page cache and schedules rescan', async () => {
    const fetcher = createMockFetcher(mockScanResult);
    service = new HealthService({ debounceMs: 100, fetcher });
    service.attach('proj1');

    service.invalidatePage('page1');

    expect(service.getPageDiagnostics('page1')).toEqual([]);

    await vi.advanceTimersByTimeAsync(150);

    expect(fetcher).toHaveBeenCalledOnce();
    expect(service.getPageDiagnostics('page1')).toHaveLength(2);
  });

  it('invalidates entire project cache', async () => {
    const fetcher = createMockFetcher(mockScanResult);
    service = new HealthService({ debounceMs: 100, fetcher });
    service.attach('proj1');

    // First populate cache
    await service.rescan();
    expect(service.getPageDiagnostics('page1')).toHaveLength(2);

    // Now invalidate all
    service.invalidateProject();
    expect(service.getAllPageDiagnostics()).toEqual([]);

    // Rescan repopulates
    await vi.advanceTimersByTimeAsync(150);
    expect(service.getPageDiagnostics('page1')).toHaveLength(2);
  });

  it('updates project store with scan results', async () => {
    service = new HealthService({ fetcher: createMockFetcher(mockScanResult) });
    service.attach('proj1');

    await service.rescan();

    const state = useProjectStore.getState();
    expect(state.health?.score).toBe(75);
    expect(state.health?.totalPages).toBe(5);
    expect(state.diagnostics).toHaveLength(3);
  });

  it('emits health:scanned event after rescan', async () => {
    service = new HealthService({ fetcher: createMockFetcher(mockScanResult) });
    service.attach('proj1');

    const handler = vi.fn();
    eventBus.on('health:scanned', handler);

    await service.rescan();

    expect(handler).toHaveBeenCalledWith({
      projectId: 'proj1',
      score: 75,
      previousScore: null,
    });
  });

  it('emits health:scoreChanged when score differs', async () => {
    service = new HealthService({ fetcher: createMockFetcher(mockScanResult) });
    service.attach('proj1');

    const handler = vi.fn();
    eventBus.on('health:scoreChanged', handler);

    // First scan
    await service.rescan();
    expect(handler).not.toHaveBeenCalled();

    // Second scan with different score
    const newResult = {
      ...mockScanResult,
      healthScore: { ...mockScanResult.healthScore, score: 90 },
    };
    const fetcher2 = createMockFetcher(newResult);
    service['fetcher'] = fetcher2;

    await service.rescan();

    expect(handler).toHaveBeenCalledWith({
      projectId: 'proj1',
      previousScore: 75,
      newScore: 90,
    });
  });

  it('does not emit health:scoreChanged when score stays same', async () => {
    service = new HealthService({ fetcher: createMockFetcher(mockScanResult) });
    service.attach('proj1');

    const handler = vi.fn();
    eventBus.on('health:scoreChanged', handler);

    await service.rescan();
    await service.rescan();

    expect(handler).not.toHaveBeenCalled();
  });

  it('page:updated event invalidates page and triggers rescan', async () => {
    const fetcher = createMockFetcher(mockScanResult);
    service = new HealthService({ debounceMs: 50, fetcher });
    service.attach('proj1');

    // Populate cache first
    await service.rescan();
    expect(service.getPageDiagnostics('page1')).toHaveLength(2);
    fetcher.mockClear();

    // Emit page:updated for page1
    eventBus.emit('page:updated', {
      pageId: 'page1',
      projectId: 'proj1',
      changes: { content: 'updated content' },
    });

    // Cache cleared immediately
    expect(service.getPageDiagnostics('page1')).toEqual([]);

    // Rescan triggered after debounce
    await vi.advanceTimersByTimeAsync(100);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('page:updated for different project does not invalidate', async () => {
    const fetcher = createMockFetcher(mockScanResult);
    service = new HealthService({ debounceMs: 50, fetcher });
    service.attach('proj1');

    await service.rescan();
    fetcher.mockClear();

    eventBus.emit('page:updated', {
      pageId: 'page1',
      projectId: 'proj2',
      changes: { content: 'updated' },
    });

    expect(service.getPageDiagnostics('page1')).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(100);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('diagnostic:fixed event invalidates the page', async () => {
    const fetcher = createMockFetcher(mockScanResult);
    service = new HealthService({ debounceMs: 50, fetcher });
    service.attach('proj1');

    await service.rescan();
    fetcher.mockClear();

    eventBus.emit('diagnostic:fixed', {
      projectId: 'proj1',
      pageId: 'page1',
      diagnosticId: 'd1',
    });

    expect(service.getPageDiagnostics('page1')).toEqual([]);

    await vi.advanceTimersByTimeAsync(100);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('document:saved event invalidates the page', async () => {
    const fetcher = createMockFetcher(mockScanResult);
    service = new HealthService({ debounceMs: 50, fetcher });
    service.attach('proj1');

    await service.rescan();
    fetcher.mockClear();

    eventBus.emit('document:saved', {
      pageId: 'page1',
      content: 'new content',
      snapshotId: 'snap1',
    });

    expect(service.getPageDiagnostics('page1')).toEqual([]);

    await vi.advanceTimersByTimeAsync(100);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('import:completed event invalidates entire project', async () => {
    const fetcher = createMockFetcher(mockScanResult);
    service = new HealthService({ debounceMs: 50, fetcher });
    service.attach('proj1');

    await service.rescan();
    fetcher.mockClear();

    eventBus.emit('import:completed', {
      projectId: 'proj1',
      type: 'code',
      pagesCreated: 5,
    });

    expect(service.getAllPageDiagnostics()).toEqual([]);

    await vi.advanceTimersByTimeAsync(100);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('page:created triggers rescan', async () => {
    const fetcher = createMockFetcher(mockScanResult);
    service = new HealthService({ debounceMs: 50, fetcher });
    service.attach('proj1');

    eventBus.emit('page:created', { pageId: 'new', projectId: 'proj1' });

    await vi.advanceTimersByTimeAsync(100);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('page:deleted removes page from cache and triggers rescan', async () => {
    const fetcher = createMockFetcher(mockScanResult);
    service = new HealthService({ debounceMs: 50, fetcher });
    service.attach('proj1');

    await service.rescan();
    expect(service.getPageDiagnostics('page1')).toHaveLength(2);
    fetcher.mockClear();

    eventBus.emit('page:deleted', { pageId: 'page1', projectId: 'proj1' });

    expect(service.getPageDiagnostics('page1')).toEqual([]);

    await vi.advanceTimersByTimeAsync(100);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('does not rescan when already in flight', async () => {
    let resolveFetch: (v: Response) => void;
    const fetcher = vi.fn().mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; }),
    );
    service = new HealthService({ debounceMs: 10, fetcher });
    service.attach('proj1');

    // Start first rescan
    const p1 = service.rescan();
    // Start second rescan (should be blocked)
    const p2 = service.rescan();

    resolveFetch!({ ok: true, json: () => Promise.resolve(mockScanResult) } as Response);
    await p1;

    resolveFetch!({ ok: true, json: () => Promise.resolve(mockScanResult) } as Response);
    await p2;

    // fetcher called once because second rescan was blocked
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('returns null when fetch fails', async () => {
    service = new HealthService({ fetcher: createFailingFetcher() });
    service.attach('proj1');

    const result = await service.rescan();
    expect(result).toBeNull();
  });

  it('debounces rapid invalidations', async () => {
    const fetcher = createMockFetcher(mockScanResult);
    service = new HealthService({ debounceMs: 100, fetcher });
    service.attach('proj1');

    // Rapid-fire invalidations
    service.invalidatePage('page1');
    service.invalidatePage('page1');
    service.invalidatePage('page1');

    // Not yet
    await vi.advanceTimersByTimeAsync(50);
    expect(fetcher).not.toHaveBeenCalled();

    // Now
    await vi.advanceTimersByTimeAsync(100);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('groups diagnostics by page in cache', async () => {
    service = new HealthService({ fetcher: createMockFetcher(mockScanResult) });
    service.attach('proj1');

    await service.rescan();

    expect(service.getPageDiagnostics('page1')).toHaveLength(2);
    expect(service.getPageDiagnostics('page2')).toHaveLength(1);
    expect(service.getAllPageDiagnostics()).toHaveLength(2);
  });

  it('page:published triggers rescan', async () => {
    const fetcher = createMockFetcher(mockScanResult);
    service = new HealthService({ debounceMs: 50, fetcher });
    service.attach('proj1');

    eventBus.emit('page:published', { pageId: 'page1', projectId: 'proj1' });

    await vi.advanceTimersByTimeAsync(100);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('page:unpublished triggers rescan', async () => {
    const fetcher = createMockFetcher(mockScanResult);
    service = new HealthService({ debounceMs: 50, fetcher });
    service.attach('proj1');

    eventBus.emit('page:unpublished', { pageId: 'page1', projectId: 'proj1' });

    await vi.advanceTimersByTimeAsync(100);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('returns null from rescan when no project attached', async () => {
    const fetcher = createMockFetcher(mockScanResult);
    service = new HealthService({ fetcher });

    const result = await service.rescan();
    expect(result).toBeNull();
  });

  it('detach clears pending debounce timers', async () => {
    const fetcher = createMockFetcher(mockScanResult);
    service = new HealthService({ debounceMs: 100, fetcher });
    service.attach('proj1');

    service.invalidatePage('page1');
    service.detach();

    await vi.advanceTimersByTimeAsync(200);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('scheduleRescan coalesces multiple invalidations', async () => {
    const fetcher = createMockFetcher(mockScanResult);
    service = new HealthService({ debounceMs: 100, fetcher });
    service.attach('proj1');

    service.invalidatePage('page1');
    service.invalidatePage('page2');
    service.invalidateProject();

    await vi.advanceTimersByTimeAsync(150);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('selector helpers work with store', () => {
    useProjectStore.getState().setHealth({
      score: 85,
      totalPages: 10,
      diagnostics: [],
      healthScore: {
        score: 85,
        grade: 'B',
        label: 'Very Good',
        color: 'green',
        errorCount: 0,
        warningCount: 2,
        infoCount: 3,
        totalIssues: 5,
        fixableCount: 1,
        categoryBreakdown: [],
      },
      scannedAt: new Date().toISOString(),
      previousScore: 80,
      previousScanAt: new Date().toISOString(),
    });

    const state = useProjectStore.getState();
    expect(selectHealth(state)?.score).toBe(85);
    expect(selectHealthScore(state)?.grade).toBe('B');
  });
});
