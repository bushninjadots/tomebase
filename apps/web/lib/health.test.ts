import { describe, it, expect } from 'vitest';
import { analyzePages, getHealthColor, getHealthLabel, getScoreRingColor } from './health';

function makePage(overrides: Partial<{
  id: string; title: string; slug: string; content: string;
  published: boolean; viewCount: number; lastViewedAt: Date | null;
  updatedAt: Date; createdAt: Date;
}> = {}) {
  return {
    id: overrides.id ?? 'page-1',
    title: overrides.title ?? 'Test Page',
    slug: overrides.slug ?? 'test-page',
    content: overrides.content ?? '# Hello\n\nSome content here with enough words to pass the checks. '.repeat(10),
    published: overrides.published ?? true,
    viewCount: overrides.viewCount ?? 10,
    lastViewedAt: overrides.lastViewedAt ?? null,
    updatedAt: overrides.updatedAt ?? new Date(),
    createdAt: overrides.createdAt ?? new Date(),
  };
}

describe('analyzePages', () => {
  it('returns 100 score for empty page list', () => {
    const report = analyzePages([]);
    expect(report.score).toBe(100);
    expect(report.totalPages).toBe(0);
    expect(report.issues).toHaveLength(0);
  });

  it('returns 100 score for a single healthy page', () => {
    const content = '# Hello\n\n' + 'This is a well-written documentation page with enough content. '.repeat(5) + '\n\n```js\nconsole.log("hi");\n```\n\n- Item one\n- Item two\n- Item three';
    const report = analyzePages([makePage({ content })]);
    expect(report.score).toBe(100);
    expect(report.totalPages).toBe(1);
  });

  it('detects broken wiki links', () => {
    const pages = [
      makePage({ id: 'p1', title: 'Page A', content: 'Link to [[Missing Page]] here.' }),
      makePage({ id: 'p2', title: 'Missing Page', content: 'Content' }),
    ];
    const report = analyzePages(pages);
    const brokenLinks = report.issues.filter((i) => i.category === 'broken_link');
    expect(brokenLinks.length).toBe(0);

    const pages2 = [
      makePage({ id: 'p1', title: 'Page A', content: 'Link to [[Nonexistent]] here.' }),
    ];
    const report2 = analyzePages(pages2);
    expect(report2.issues.filter((i) => i.category === 'broken_link').length).toBe(1);
  });

  it('detects orphan pages', () => {
    const pages = [
      makePage({ id: 'p1', title: 'Page A', content: '# Hello\n\nSome content'.repeat(10) }),
      makePage({ id: 'p2', title: 'Page B', content: '# Hello\n\nSome content'.repeat(10) }),
    ];
    const report = analyzePages(pages);
    const orphans = report.issues.filter((i) => i.category === 'orphan');
    expect(orphans.length).toBe(2);
  });

  it('does not mark orphan when page is linked', () => {
    const pages = [
      makePage({ id: 'p1', title: 'Page A', content: 'Link to [[Page B]] here. ' + 'Word '.repeat(50) }),
      makePage({ id: 'p2', title: 'Page B', content: 'Link to [[Page A]] here. ' + 'Word '.repeat(50) }),
    ];
    const report = analyzePages(pages);
    const orphans = report.issues.filter((i) => i.category === 'orphan');
    expect(orphans.length).toBe(0);
  });

  it('detects empty pages', () => {
    const report = analyzePages([makePage({ content: '' })]);
    expect(report.issues.filter((i) => i.category === 'empty').length).toBe(1);
  });

  it('detects stale pages', () => {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 60);
    const report = analyzePages([makePage({ updatedAt: staleDate })]);
    expect(report.issues.filter((i) => i.category === 'stale').length).toBe(1);
  });

  it('detects low engagement', () => {
    const report = analyzePages([makePage({ viewCount: 2, published: true })]);
    expect(report.issues.filter((i) => i.category === 'low_engagement').length).toBe(1);
  });

  it('detects pages with no headings', () => {
    const report = analyzePages([makePage({ content: 'Just plain text without any headings at all. '.repeat(30) })]);
    expect(report.issues.filter((i) => i.category === 'no_headings').length).toBe(1);
  });

  it('detects thin content', () => {
    const report = analyzePages([makePage({ content: 'Short.' })]);
    expect(report.issues.filter((i) => i.category === 'thin_content').length).toBe(1);
  });

  it('detects missing language tags on code blocks', () => {
    const content = 'Some text\n\n```\ncode here\n```\n\nMore text';
    const report = analyzePages([makePage({ content })]);
    expect(report.issues.filter((i) => i.category === 'missing_language_tag').length).toBe(1);
  });

  it('does not flag code blocks with language tags', () => {
    const content = 'Some text\n\n```js\ncode here\n```\n\nMore text\n\n```python\nmore code\n```';
    const report = analyzePages([makePage({ content })]);
    expect(report.issues.filter((i) => i.category === 'missing_language_tag').length).toBe(0);
  });

  it('reduces score for issues', () => {
    const healthy = analyzePages([makePage()]);
    const withIssues = analyzePages([makePage({ content: '', viewCount: 0 })]);
    expect(withIssues.score).toBeLessThan(healthy.score);
  });
});

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
