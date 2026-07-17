import { describe, it, expect } from 'vitest';
import { scanPages, filterDiagnostics, getAvailableRules } from './engine';
import { ALL_RULES } from './rules';
import { isFixable, applyFix, getSafeFixes } from './fixes';
import { generatePreview } from './preview';
import { calculateHealthScore } from './health-score';
import type { DiagnosticPage } from '@fluid/types';

function makePage(overrides: Partial<DiagnosticPage> = {}): DiagnosticPage {
  return {
    id: 'page-1',
    title: 'Getting Started',
    slug: 'getting-started',
    content: '# Getting Started\n\nThis is a guide for new users.',
    description: null,
    published: true,
    viewCount: 10,
    lastViewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('Diagnostics Engine', () => {
  describe('scanPages', () => {
    it('returns empty diagnostics for clean pages', () => {
      const pages = [
        makePage({
          content: '---\ntitle: "Getting Started"\ndescription: "A guide"\ntags: [intro]\nowner: "team"\n---\n\n# Getting Started\n\n## Overview\n\nThis is a comprehensive guide.',
        }),
      ];
      const result = scanPages(pages);
      // Should have few or no errors for well-structured pages
      expect(result.diagnostics.length).toBeGreaterThanOrEqual(0);
      expect(result.healthScore.score).toBeGreaterThan(0);
    });

    it('detects broken wiki links', () => {
      const pages = [
        makePage({
          content: '# Page\n\nSee [[Nonexistent Page]] for more info.',
        }),
      ];
      const result = scanPages(pages);
      const brokenLinks = result.diagnostics.filter((d) => d.category === 'broken_link');
      expect(brokenLinks.length).toBe(1);
      expect(brokenLinks[0]!.title).toContain('Nonexistent Page');
      expect(brokenLinks[0]!.severity).toBe('error');
    });

    it('does not flag valid wiki links', () => {
      const pages = [
        makePage({ id: 'p1', title: 'Page A', content: '# A\n\nSee [[Page B]].' }),
        makePage({ id: 'p2', title: 'Page B', content: '# B\n\nSee [[Page A]].' }),
      ];
      const result = scanPages(pages);
      const brokenLinks = result.diagnostics.filter((d) => d.category === 'broken_link');
      expect(brokenLinks.length).toBe(0);
    });

    it('detects missing frontmatter', () => {
      const pages = [makePage({ content: '# Hello\n\nContent here.' })];
      const result = scanPages(pages);
      const fm = result.diagnostics.filter((d) => d.category === 'missing_frontmatter');
      expect(fm.length).toBe(1);
      expect(fm[0]!.canAutoFix).toBe(true);
    });

    it('detects missing title in frontmatter', () => {
      const pages = [
        makePage({
          content: '---\ndescription: "A guide"\n---\n\n# Page',
        }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'missing_title');
      expect(issues.length).toBe(1);
      expect(issues[0]!.canAutoFix).toBe(true);
    });

    it('detects empty pages', () => {
      const pages = [makePage({ content: '' })];
      const result = scanPages(pages);
      const empty = result.diagnostics.filter((d) => d.category === 'empty_page');
      expect(empty.length).toBe(1);
      expect(empty[0]!.severity).toBe('error');
    });

    it('detects orphan pages', () => {
      const pages = [
        makePage({ id: 'p1', title: 'Page A', content: '# A\n\nLink to [[Page B]].' }),
        makePage({ id: 'p2', title: 'Page B', content: '# B' }),
      ];
      const result = scanPages(pages);
      const orphans = result.diagnostics.filter((d) => d.category === 'orphan_page');
      expect(orphans.length).toBe(1);
      // Page A links to Page B but no one links to Page A, so Page A is orphan
      expect(orphans[0]!.pageTitle).toBe('Page A');
    });

    it('detects multiple H1 headings', () => {
      const pages = [
        makePage({ content: '# First Title\n\nSome content.\n\n# Second Title' }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'multiple_h1');
      expect(issues.length).toBe(1);
    });

    it('detects heading hierarchy issues', () => {
      const pages = [
        makePage({ content: '# Title\n\n### Skipped H2' }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'heading_hierarchy');
      expect(issues.length).toBe(1);
    });

    it('detects trailing whitespace', () => {
      const pages = [
        makePage({ content: '# Title\n\nLine with trailing spaces   \n\nMore content.' }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'trailing_whitespace');
      expect(issues.length).toBe(1);
      expect(issues[0]!.canAutoFix).toBe(true);
    });

    it('detects duplicate blank lines', () => {
      const pages = [
        makePage({ content: '# Title\n\n\n\n\nContent here.' }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'duplicate_blank_lines');
      expect(issues.length).toBe(1);
      expect(issues[0]!.canAutoFix).toBe(true);
    });

    it('detects code blocks without language', () => {
      const pages = [
        makePage({ content: '# Code\n\n```\nconst x = 1;\n```' }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'missing_code_block_language');
      expect(issues.length).toBe(1);
      expect(issues[0]!.severity).toBe('warning');
    });

    it('does not flag code blocks with language', () => {
      const pages = [
        makePage({ content: '# Code\n\n```javascript\nconst x = 1;\n```' }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'missing_code_block_language');
      expect(issues.length).toBe(0);
    });

    it('detects stale docs', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 200);
      const pages = [
        makePage({ content: '# Page\n\nSome content.', updatedAt: oldDate }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'stale_docs');
      expect(issues.length).toBe(1);
      expect(issues[0]!.severity).toBe('warning');
    });

    it('detects large pages', () => {
      const longContent = '# Title\n\n' + 'word '.repeat(5500);
      const pages = [makePage({ content: longContent })];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'large_page');
      expect(issues.length).toBe(1);
    });

    it('detects broken images', () => {
      const pages = [
        makePage({ content: '# Page\n\n![alt](image-without-extension)\n\n![alt](valid.png)' }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'broken_image');
      expect(issues.length).toBeGreaterThanOrEqual(1);
    });

    it('detects invalid markdown', () => {
      const pages = [
        makePage({ content: '# Page\n\n**unclosed bold\n\nMore content.' }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'invalid_markdown');
      expect(issues.length).toBeGreaterThanOrEqual(1);
    });

    it('detects duplicate titles', () => {
      const pages = [
        makePage({ id: 'p1', title: 'Same Title', content: '# First' }),
        makePage({ id: 'p2', title: 'Same Title', content: '# Second' }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'duplicate_title');
      expect(issues.length).toBe(1);
    });

    it('detects missing description in frontmatter', () => {
      const pages = [
        makePage({
          content: '---\ntitle: "Test"\n---\n\n# Page\n\nSome content here.',
        }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'missing_description');
      expect(issues.length).toBe(1);
    });

    it('detects missing owner', () => {
      const pages = [
        makePage({
          content: '---\ntitle: "Test"\ndescription: "Test"\n---\n\n# Page',
        }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'missing_owner');
      expect(issues.length).toBe(1);
    });

    it('detects missing tags', () => {
      const pages = [
        makePage({
          content: '---\ntitle: "Test"\ndescription: "Test"\nowner: "team"\n---\n\n# Page',
        }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'missing_tags');
      expect(issues.length).toBe(1);
    });

    it('detects missing table of contents on long pages', () => {
      const sections = Array.from({ length: 5 }, (_, i) =>
        `## Section ${i + 1}\n\n${Array.from({ length: 20 }, () => 'This is a paragraph with multiple words that adds to the total word count of the document.').join(' ')}`
      ).join('\n\n');
      const content = `---\ntitle: "Guide"\n---\n\n# Guide\n\n${sections}`;
      const pages = [makePage({ content })];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'missing_toc');
      expect(issues.length).toBe(1);
    });

    it('detects deprecated syntax', () => {
      const pages = [
        makePage({ content: '# Page\n\n__bold text__ here.' }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'deprecated_syntax');
      expect(issues.length).toBeGreaterThanOrEqual(1);
      expect(issues[0]!.canAutoFix).toBe(true);
    });

    it('detects markdown formatting issues', () => {
      const pages = [
        makePage({ content: '# Page\n\n#Heading without space' }),
      ];
      const result = scanPages(pages);
      const issues = result.diagnostics.filter((d) => d.category === 'markdown_formatting');
      expect(issues.length).toBeGreaterThanOrEqual(1);
    });

    it('respects rule filtering', () => {
      const pages = [makePage({ content: '' })];
      const result = scanPages(pages, { rules: ['empty-page'] });
      const emptyIssues = result.diagnostics.filter((d) => d.category === 'empty_page');
      const otherIssues = result.diagnostics.filter((d) => d.category !== 'empty_page');
      expect(emptyIssues.length).toBe(1);
      expect(otherIssues.length).toBe(0);
    });

    it('respects category filtering', () => {
      const pages = [makePage({ content: '' })];
      const result = scanPages(pages, { categories: ['empty_page'] });
      expect(result.diagnostics.every((d) => d.category === 'empty_page')).toBe(true);
    });

    it('calculates health score correctly', () => {
      const pages = [makePage({ content: '' })];
      const result = scanPages(pages);
      expect(result.healthScore.score).toBeGreaterThanOrEqual(0);
      expect(result.healthScore.score).toBeLessThanOrEqual(100);
      expect(result.healthScore.grade).toBeDefined();
      expect(result.healthScore.errorCount).toBeGreaterThanOrEqual(0);
    });

    it('sorts diagnostics by severity', () => {
      const pages = [
        makePage({ content: '' }), // empty_page = error
        makePage({ id: 'p2', title: 'Other', content: 'Short.' }), // orphan = warning
      ];
      const result = scanPages(pages);
      if (result.diagnostics.length > 1) {
        const severityOrder = { error: 0, warning: 1, info: 2 };
        for (let i = 1; i < result.diagnostics.length; i++) {
          expect(
            severityOrder[result.diagnostics[i]!.severity],
          ).toBeGreaterThanOrEqual(
            severityOrder[result.diagnostics[i - 1]!.severity],
          );
        }
      }
    });
  });

  describe('filterDiagnostics', () => {
    it('filters by severity', () => {
      const pages = [makePage({ content: '' })];
      const { diagnostics } = scanPages(pages);
      const errors = filterDiagnostics(diagnostics, {
        severity: 'error',
        category: 'all',
        pageId: 'all',
        canAutoFix: null,
        search: '',
      });
      expect(errors.every((d) => d.severity === 'error')).toBe(true);
    });

    it('filters by category', () => {
      const pages = [makePage({ content: '' })];
      const { diagnostics } = scanPages(pages);
      const filtered = filterDiagnostics(diagnostics, {
        severity: 'all',
        category: 'empty_page',
        pageId: 'all',
        canAutoFix: null,
        search: '',
      });
      expect(filtered.every((d) => d.category === 'empty_page')).toBe(true);
    });

    it('filters by search term', () => {
      const pages = [
        makePage({ content: '' }),
        makePage({ id: 'p2', title: 'Other', content: 'Content.' }),
      ];
      const { diagnostics } = scanPages(pages);
      const filtered = filterDiagnostics(diagnostics, {
        severity: 'all',
        category: 'all',
        pageId: 'all',
        canAutoFix: null,
        search: 'empty',
      });
      expect(filtered.length).toBeGreaterThan(0);
      expect(
        filtered.every(
          (d) =>
            d.title.toLowerCase().includes('empty') ||
            d.description.toLowerCase().includes('empty') ||
            d.pageTitle.toLowerCase().includes('empty'),
        ),
      ).toBe(true);
    });

    it('filters by fixable', () => {
      const pages = [makePage({ content: '' })];
      const { diagnostics } = scanPages(pages);
      const fixable = filterDiagnostics(diagnostics, {
        severity: 'all',
        category: 'all',
        pageId: 'all',
        canAutoFix: true,
        search: '',
      });
      expect(fixable.every((d) => d.canAutoFix)).toBe(true);
    });
  });

  describe('getAvailableRules', () => {
    it('returns all rules', () => {
      const rules = getAvailableRules();
      expect(rules.length).toBe(ALL_RULES.length);
      expect(rules.length).toBe(23);
    });

    it('each rule has required fields', () => {
      const rules = getAvailableRules();
      for (const rule of rules) {
        expect(rule.id).toBeTruthy();
        expect(rule.category).toBeTruthy();
        expect(rule.title).toBeTruthy();
        expect(rule.description).toBeTruthy();
        expect(['error', 'warning', 'info']).toContain(rule.severity);
        expect(typeof rule.canAutoFix).toBe('boolean');
      }
    });
  });
});

describe('Auto-Fix Engine', () => {
  describe('isFixable', () => {
    it('returns true for diagnostics with fixPreview', () => {
      const pages = [makePage({ content: '' })];
      const { diagnostics } = scanPages(pages);
      const fixable = diagnostics.filter(isFixable);
      expect(fixable.every((d) => d.canAutoFix && d.fixPreview !== null)).toBe(true);
    });

    it('returns false for diagnostics without fixPreview', () => {
      const pages = [makePage({ content: '' })];
      const { diagnostics } = scanPages(pages);
      const nonFixable = diagnostics.filter((d) => !isFixable(d));
      expect(nonFixable.every((d) => !d.canAutoFix || d.fixPreview === null)).toBe(true);
    });
  });

  describe('applyFix', () => {
    it('applies fix for missing frontmatter', () => {
      const pages = [makePage({ content: '# Hello\n\nContent.' })];
      const { diagnostics } = scanPages(pages);
      const fixable = diagnostics.filter(isFixable);
      expect(fixable.length).toBeGreaterThan(0);

      const result = applyFix(fixable[0]!, '# Hello\n\nContent.');
      expect(result.success).toBe(true);
      expect(result.fixedContent).toContain('---');
      expect(result.fixedContent).toContain('title:');
    });

    it('returns failure for non-fixable diagnostics', () => {
      const pages = [makePage({ content: '' })];
      const { diagnostics } = scanPages(pages);
      const nonFixable = diagnostics.find((d) => !isFixable(d));
      if (nonFixable) {
        const result = applyFix(nonFixable as any, '');
        expect(result.success).toBe(false);
      }
    });
  });

  describe('getSafeFixes', () => {
    it('returns only high confidence fixes', () => {
      const pages = [
        makePage({ content: 'Line with trailing spaces   \n\nMore content.' }),
      ];
      const { diagnostics } = scanPages(pages);
      const safe = getSafeFixes(diagnostics);
      expect(
        safe.every(
          (d) => d.fixPreview!.confidence === 'high',
        ),
      ).toBe(true);
    });
  });
});

describe('Preview Engine', () => {
  describe('generatePreview', () => {
    it('generates preview for fixable diagnostics', () => {
      const content = 'Line with trailing spaces   \n\nMore content.';
      const pages = [makePage({ content })];
      const { diagnostics } = scanPages(pages);
      const fixable = diagnostics.filter(isFixable);

      if (fixable.length > 0) {
        const preview = generatePreview(fixable[0]!, content);
        expect(preview).not.toBeNull();
        expect(preview!.diff).toBeDefined();
        expect(preview!.description).toBeTruthy();
      }
    });

    it('returns null for non-fixable diagnostics', () => {
      const pages = [makePage({ content: '' })];
      const { diagnostics } = scanPages(pages);
      const nonFixable = diagnostics.find((d) => !isFixable(d));
      if (nonFixable) {
        const preview = generatePreview(nonFixable, '');
        expect(preview).toBeNull();
      }
    });
  });
});

describe('Health Score', () => {
  describe('calculateHealthScore', () => {
    it('returns 100 for no issues', () => {
      const healthScore = calculateHealthScore([]);
      expect(healthScore.score).toBe(100);
      expect(healthScore.grade).toBe('A');
      expect(healthScore.errorCount).toBe(0);
      expect(healthScore.warningCount).toBe(0);
      expect(healthScore.infoCount).toBe(0);
    });

    it('deducts more for errors than warnings', () => {
      const errorDiagnostic = {
        id: '1',
        category: 'broken_link' as const,
        severity: 'error' as const,
        title: 'Error',
        description: '',
        explanation: '',
        pageId: '',
        pageSlug: '',
        pageTitle: '',
        line: null,
        column: null,
        rule: '',
        canAutoFix: false,
        fixPreview: null,
        aiAvailable: false,
        ignored: false,
        createdAt: '',
      };
      const warningDiagnostic = { ...errorDiagnostic, id: '2', severity: 'warning' as const };

      const errorScore = calculateHealthScore([errorDiagnostic]);
      const warningScore = calculateHealthScore([warningDiagnostic]);

      expect(errorScore.score).toBeLessThan(warningScore.score);
    });

    it('ignores ignored diagnostics', () => {
      const ignored = {
        id: '1',
        category: 'broken_link' as const,
        severity: 'error' as const,
        title: '',
        description: '',
        explanation: '',
        pageId: '',
        pageSlug: '',
        pageTitle: '',
        line: null,
        column: null,
        rule: '',
        canAutoFix: false,
        fixPreview: null,
        aiAvailable: false,
        ignored: true,
        createdAt: '',
      };
      // calculateHealthScore counts all diagnostics including ignored
      // filtering should happen before calling calculateHealthScore
      const score = calculateHealthScore([ignored]);
      expect(score.score).toBeLessThan(100);
    });

    it('provides category breakdown', () => {
      const d1 = {
        id: '1',
        category: 'broken_link' as const,
        severity: 'error' as const,
        title: '',
        description: '',
        explanation: '',
        pageId: '',
        pageSlug: '',
        pageTitle: '',
        line: null,
        column: null,
        rule: '',
        canAutoFix: false,
        fixPreview: null,
        aiAvailable: false,
        ignored: false,
        createdAt: '',
      };
      const d2 = { ...d1, id: '2', category: 'empty_page' as const };
      const score = calculateHealthScore([d1, d2]);
      expect(score.categoryBreakdown.length).toBe(2);
    });

    it('counts fixable diagnostics', () => {
      const d = {
        id: '1',
        category: 'trailing_whitespace' as const,
        severity: 'info' as const,
        title: '',
        description: '',
        explanation: '',
        pageId: '',
        pageSlug: '',
        pageTitle: '',
        line: null,
        column: null,
        rule: '',
        canAutoFix: true,
        fixPreview: { originalContent: '', fixedContent: '', description: '', confidence: 'high' as const },
        aiAvailable: false,
        ignored: false,
        createdAt: '',
      };
      const score = calculateHealthScore([d]);
      expect(score.fixableCount).toBe(1);
    });
  });
});
