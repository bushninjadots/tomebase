import { describe, it, expect } from 'vitest';
import { computeDiff, computeWordDiff } from './diff';

describe('computeDiff', () => {
  it('detects identical texts', () => {
    const result = computeDiff('hello\nworld', 'hello\nworld');
    expect(result.added).toBe(0);
    expect(result.removed).toBe(0);
    expect(result.unchanged).toBe(2);
  });

  it('detects added lines', () => {
    const result = computeDiff('line1', 'line1\nline2');
    expect(result.added).toBe(1);
    expect(result.removed).toBe(0);
    expect(result.lines[1]!.type).toBe('added');
  });

  it('detects removed lines', () => {
    const result = computeDiff('line1\nline2', 'line1');
    expect(result.removed).toBe(1);
    expect(result.added).toBe(0);
  });

  it('detects mixed changes', () => {
    const old = 'a\nb\nc';
    const newText = 'a\nx\nc';
    const result = computeDiff(old, newText);
    expect(result.removed).toBe(1);
    expect(result.added).toBe(1);
    expect(result.unchanged).toBe(2);
  });

  it('handles empty old text', () => {
    const result = computeDiff('', 'new line');
    expect(result.added + result.removed).toBeGreaterThanOrEqual(1);
  });

  it('handles empty new text', () => {
    const result = computeDiff('old line', '');
    expect(result.added + result.removed).toBeGreaterThanOrEqual(1);
  });

  it('handles both empty', () => {
    const result = computeDiff('', '');
    expect(result.unchanged).toBeGreaterThanOrEqual(0);
  });
});

describe('computeWordDiff', () => {
  it('detects unchanged text', () => {
    const result = computeWordDiff('hello world', 'hello world');
    expect(result.every((r) => r.type === 'unchanged')).toBe(true);
  });

  it('detects added words', () => {
    const result = computeWordDiff('hello', 'hello world');
    const added = result.filter((r) => r.type === 'added');
    expect(added.length).toBeGreaterThan(0);
  });

  it('detects removed words', () => {
    const result = computeWordDiff('hello world', 'hello');
    const removed = result.filter((r) => r.type === 'removed');
    expect(removed.length).toBeGreaterThan(0);
  });
});
