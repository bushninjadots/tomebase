import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, rateLimitResponse, cleanupRateLimits } from './rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows first request', () => {
    const result = checkRateLimit('first-req', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('tracks multiple requests', () => {
    const result1 = checkRateLimit('multi-track', 5, 60_000);
    expect(result1.remaining).toBe(4);

    const result2 = checkRateLimit('multi-track', 5, 60_000);
    expect(result2.remaining).toBe(3);

    const result3 = checkRateLimit('multi-track', 5, 60_000);
    expect(result3.remaining).toBe(2);
  });

  it('blocks when limit exceeded', () => {
    checkRateLimit('block-test', 3, 60_000);
    checkRateLimit('block-test', 3, 60_000);
    checkRateLimit('block-test', 3, 60_000);

    const result = checkRateLimit('block-test', 3, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', () => {
    checkRateLimit('reset-test', 2, 60_000);
    checkRateLimit('reset-test', 2, 60_000);

    const blocked = checkRateLimit('reset-test', 2, 60_000);
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    const allowed = checkRateLimit('reset-test', 2, 60_000);
    expect(allowed.allowed).toBe(true);
    expect(allowed.remaining).toBe(1);
  });

  it('isolates different keys', () => {
    checkRateLimit('key-alpha', 2, 60_000);
    checkRateLimit('key-alpha', 2, 60_000);

    const resultA = checkRateLimit('key-alpha', 2, 60_000);
    expect(resultA.allowed).toBe(false);

    const resultB = checkRateLimit('key-beta', 2, 60_000);
    expect(resultB.allowed).toBe(true);
  });
});

describe('rateLimitResponse', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when allowed', () => {
    const result = checkRateLimit('resp-allow', 5, 60_000);
    const response = rateLimitResponse(result);
    expect(response).toBeNull();
  });

  it('returns 429 response when blocked', () => {
    checkRateLimit('resp-block', 1, 60_000);
    const result = checkRateLimit('resp-block', 1, 60_000);
    const response = rateLimitResponse(result);

    expect(response).not.toBeNull();
    expect(response!.status).toBe(429);
    expect(response!.headers.get('Retry-After')).toBeTruthy();
    expect(response!.headers.get('X-RateLimit-Remaining')).toBe('0');
  });
});

describe('cleanupRateLimits', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('removes expired entries', () => {
    checkRateLimit('cleanup-test', 5, 1_000);
    vi.advanceTimersByTime(1_001);

    cleanupRateLimits();

    const result = checkRateLimit('cleanup-test', 5, 60_000);
    expect(result.remaining).toBe(4);
  });
});
