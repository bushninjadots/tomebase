import { describe, it, expect } from 'vitest';
import { calculateHealthScore, getHealthLabel } from './health-score';
import type { Diagnostic } from '@fluid/types';

function makeDiagnostic(overrides: Partial<Diagnostic> = {}): Diagnostic {
  return {
    id: 'diag-1',
    pageId: 'page-1',
    pageSlug: 'test-page',
    pageTitle: 'Test Page',
    rule: 'broken-link',
    category: 'broken_link',
    severity: 'error',
    title: 'Broken link',
    description: 'Wiki link points to nonexistent page',
    explanation: 'The page [[Missing]] does not exist.',
    line: 5,
    column: null,
    canAutoFix: false,
    fixPreview: null,
    aiAvailable: true,
    ignored: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Health Score', () => {
  it('returns 100 for empty diagnostics', () => {
    const result = calculateHealthScore([]);
    expect(result.score).toBe(100);
    expect(result.grade).toBe('A');
    expect(result.errorCount).toBe(0);
    expect(result.warningCount).toBe(0);
    expect(result.infoCount).toBe(0);
  });

  it('deducts more for errors than warnings', () => {
    const errorResult = calculateHealthScore([
      makeDiagnostic({ severity: 'error' }),
    ]);
    const warningResult = calculateHealthScore([
      makeDiagnostic({ severity: 'warning' }),
    ]);
    expect(errorResult.score).toBeLessThan(warningResult.score);
  });

  it('deducts more for warnings than info', () => {
    const warningResult = calculateHealthScore([
      makeDiagnostic({ severity: 'warning' }),
    ]);
    const infoResult = calculateHealthScore([
      makeDiagnostic({ severity: 'info' }),
    ]);
    expect(warningResult.score).toBeLessThan(infoResult.score);
  });

  it('uses diminishing returns for repeated issues', () => {
    const oneError = calculateHealthScore([
      makeDiagnostic({ severity: 'error', id: 'e1' }),
    ]);
    const twoErrors = calculateHealthScore([
      makeDiagnostic({ severity: 'error', id: 'e1' }),
      makeDiagnostic({ severity: 'error', id: 'e2' }),
    ]);
    const threeErrors = calculateHealthScore([
      makeDiagnostic({ severity: 'error', id: 'e1' }),
      makeDiagnostic({ severity: 'error', id: 'e2' }),
      makeDiagnostic({ severity: 'error', id: 'e3' }),
    ]);
    // Each additional error costs less than the previous
    const drop1 = oneError.score - twoErrors.score;
    const drop2 = twoErrors.score - threeErrors.score;
    expect(drop1).toBeGreaterThan(drop2);
  });

  it('applies category multipliers for critical categories', () => {
    const brokenLink = calculateHealthScore([
      makeDiagnostic({ severity: 'error', category: 'broken_link' }),
    ]);
    const staleDocs = calculateHealthScore([
      makeDiagnostic({ severity: 'error', category: 'stale_docs' }),
    ]);
    // broken_link has 1.5x multiplier, stale_docs has 0.9x
    expect(brokenLink.score).toBeLessThan(staleDocs.score);
  });

  it('never goes below 0', () => {
    const manyIssues = Array.from({ length: 50 }, (_, i) =>
      makeDiagnostic({ severity: 'error', id: `e${i}` }),
    );
    const result = calculateHealthScore(manyIssues);
    expect(result.score).toBe(0);
  });

  it('never goes above 100', () => {
    const result = calculateHealthScore([]);
    expect(result.score).toBe(100);
  });

  it('counts fixable diagnostics', () => {
    const result = calculateHealthScore([
      makeDiagnostic({ canAutoFix: true }),
      makeDiagnostic({ canAutoFix: false, id: 'd2' }),
      makeDiagnostic({ canAutoFix: true, id: 'd3' }),
    ]);
    expect(result.fixableCount).toBe(2);
  });

  it('generates category breakdown', () => {
    const result = calculateHealthScore([
      makeDiagnostic({ category: 'broken_link' }),
      makeDiagnostic({ category: 'broken_link', id: 'd2' }),
      makeDiagnostic({ category: 'missing_frontmatter', id: 'd3', severity: 'warning' }),
    ]);
    expect(result.categoryBreakdown.length).toBe(2);
    const brokenLinkCat = result.categoryBreakdown.find((c) => c.category === 'broken_link');
    expect(brokenLinkCat?.count).toBe(2);
  });

  it('grades correctly', () => {
    expect(calculateHealthScore([]).grade).toBe('A');
    // 3 errors should bring score below 90
    const threeErrors = calculateHealthScore([
      makeDiagnostic({ severity: 'error', id: 'e1' }),
      makeDiagnostic({ severity: 'error', id: 'e2' }),
      makeDiagnostic({ severity: 'error', id: 'e3' }),
    ]);
    expect(threeErrors.grade).not.toBe('A');
  });
});

describe('Health Score Labels', () => {
  it('returns correct labels for score ranges', () => {
    expect(getHealthLabel(95)).toBe('Excellent');
    expect(getHealthLabel(85)).toBe('Very Good');
    expect(getHealthLabel(75)).toBe('Good');
    expect(getHealthLabel(65)).toBe('Fair');
    expect(getHealthLabel(45)).toBe('Needs Attention');
    expect(getHealthLabel(20)).toBe('Critical');
  });
});
