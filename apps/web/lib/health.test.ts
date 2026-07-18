import { describe, it, expect } from 'vitest';
import { getHealthColor, getHealthLabel, getScoreRingColor } from './health';

describe('getHealthColor', () => {
  it('returns green for high scores', () => {
    expect(getHealthColor(80)).toContain('green');
    expect(getHealthColor(100)).toContain('green');
  });

  it('returns amber for medium scores', () => {
    expect(getHealthColor(65)).toContain('amber');
  });

  it('returns orange for low scores', () => {
    expect(getHealthColor(45)).toContain('orange');
  });

  it('returns red for critical scores', () => {
    expect(getHealthColor(20)).toContain('red');
  });
});

describe('getHealthLabel', () => {
  it('returns correct labels', () => {
    expect(getHealthLabel(95)).toBe('Excellent');
    expect(getHealthLabel(85)).toBe('Very Good');
    expect(getHealthLabel(75)).toBe('Good');
    expect(getHealthLabel(65)).toBe('Fair');
    expect(getHealthLabel(45)).toBe('Needs Attention');
    expect(getHealthLabel(20)).toBe('Critical');
  });
});

describe('getScoreRingColor', () => {
  it('returns correct colors', () => {
    expect(getScoreRingColor(80)).toBe('#22c55e');
    expect(getScoreRingColor(65)).toBe('#f59e0b');
    expect(getScoreRingColor(45)).toBe('#f97316');
    expect(getScoreRingColor(20)).toBe('#ef4444');
  });
});
