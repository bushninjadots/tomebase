import type { Diagnostic } from '@fluid/types';
import { makeDiagnostic, type DiagnosticRule } from './_infrastructure';

export const brokenLinkRule: DiagnosticRule = {
  id: 'broken-link',
  category: 'broken_link',
  title: 'Broken Wiki Link',
  description: 'A wiki link references a page that does not exist.',
  severity: 'error',
  canAutoFix: false,
  detect(page, allPages) {
    const diagnostics: Diagnostic[] = [];
    const regex = /\[\[([^\]|]+?)(?:\|[^\]]+)?\]\]/g;
    const pageTitles = new Set(allPages.map((p) => p.title.toLowerCase()));
    let match;

    while ((match = regex.exec(page.content)) !== null) {
      const linkTitle = match[1]!.trim();
      if (!pageTitles.has(linkTitle.toLowerCase())) {
        const line = page.content.substring(0, match.index).split('\n').length;
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            `Broken link to "${linkTitle}"`,
            `This wiki link points to a page that doesn't exist: [[${linkTitle}]]`,
            `The page "${linkTitle}" has not been created yet. Create it or update the link to point to an existing page.`,
            page,
            line,
            null,
            false,
          ),
        );
      }
    }
    return diagnostics;
  },
};

export const orphanPageRule: DiagnosticRule = {
  id: 'orphan-page',
  category: 'orphan_page',
  title: 'Orphan Page',
  description: 'No other pages link to this page.',
  severity: 'warning',
  canAutoFix: false,
  detect(page, allPages) {
    if (allPages.length <= 1) return [];

    const titleLower = page.title.toLowerCase();
    const linkedByOthers = allPages.some(
      (p) => p.id !== page.id && p.content.toLowerCase().includes(`[[${titleLower}]]`),
    );

    if (!linkedByOthers) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          `Orphan page: "${page.title}"`,
          'No other pages in this project link to this page.',
          'Orphan pages are hard to discover. Add links from related pages or add this page to the navigation.',
          page,
        ),
      ];
    }
    return [];
  },
};

export const unlinkedPageRule: DiagnosticRule = {
  id: 'unlinked-page',
  category: 'unlinked_page',
  title: 'Unlinked Page',
  description: 'This page is not referenced by any other documentation.',
  severity: 'warning',
  canAutoFix: false,
  detect(page, allPages) {
    if (allPages.length <= 1) return [];
    if (!page.published) return [];

    const titleLower = page.title.toLowerCase();
    const isLinked = allPages.some(
      (p) =>
        p.id !== page.id &&
        (p.content.toLowerCase().includes(`[[${titleLower}]]`) ||
          p.content.toLowerCase().includes(`(${page.slug})`)),
    );

    if (!isLinked) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          `Unlinked published page: "${page.title}"`,
          'This published page is not referenced by any other page.',
          'Published pages should be reachable through internal links for good navigation.',
          page,
        ),
      ];
    }
    return [];
  },
};

export const inconsistentLinkStyleRule: DiagnosticRule = {
  id: 'inconsistent-link-style',
  category: 'inconsistent_link_style',
  title: 'Inconsistent Link Style',
  description: 'The page mixes wiki-style [[links]] and markdown [links](url).',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const content = page.content;
    const wikiLinks = (content.match(/\[\[[^\]]+\]\]/g) || []).length;
    const mdLinks = (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;

    if (wikiLinks > 0 && mdLinks > 0) {
      const fixedContent = content.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '[$2]($1)')
        .replace(/\[\[([^\]]+)\]\]/g, '[$1]($1)');

      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'Mixed link styles',
          `Page uses ${wikiLinks} wiki-style and ${mdLinks} markdown-style links.`,
          'Use consistent link syntax throughout a page for cleaner documentation.',
          page,
          null,
          null,
          true,
          {
            originalContent: content,
            fixedContent,
            description: 'Convert wiki-style links to markdown links.',
            confidence: 'medium',
          },
        ),
      ];
    }
    return [];
  },
};

export const hardcodedUrlRule: DiagnosticRule = {
  id: 'hardcoded-urls',
  category: 'broken_link',
  title: 'Hardcoded Internal URL',
  description: 'An internal URL is hardcoded instead of using wiki-style links.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/```/.test(line)) continue;

      const matches = line.match(/\[([^\]]+)\]\(\.\/[^)]+\)/g);
      if (matches) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Hardcoded relative URL',
            `Line ${i + 1} uses a hardcoded relative URL.`,
            'Consider using wiki-style links [[Page Name]] for better portability.',
            page,
            i + 1,
          ),
        );
      }
    }
    return diagnostics;
  },
};

export const unnecessaryLinkTextRule: DiagnosticRule = {
  id: 'unnecessary-link-text',
  category: 'markdown_formatting',
  title: 'Unnecessary Link Text',
  description: 'A link contains text identical to its URL.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const matches = line.match(/\[([^\]]+)\]\(\1\)/g);
      if (matches) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Link text is URL',
            `Line ${i + 1} has link text identical to its URL.`,
            'When link text is the same as the URL, consider using angle brackets for auto-linking: <url>.',
            page,
            i + 1,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent: line.replace(/\[([^\]]+)\]\(\1\)/g, '<$1>'),
              description: 'Convert redundant links to auto-links.',
              confidence: 'high',
            },
          ),
        );
      }
    }
    return diagnostics;
  },
};

export const missingLinkTextRule: DiagnosticRule = {
  id: 'missing-link-text',
  category: 'broken_link',
  title: 'Empty Link Text',
  description: 'A markdown link has empty text.',
  severity: 'warning',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const matches = line.match(/\[\s*\]\(([^)]+)\)/g);
      if (matches) {
        for (const match of matches) {
          const url = match.match(/\]\(([^)]+)\)/)?.[1] || '';
          const linkText = url.split('/').pop()?.replace(/[-_]/g, ' ') || 'link';
          const fixedContent = page.content.replace(match, `[${linkText}](${url})`);

          diagnostics.push(
            makeDiagnostic(
              this.id,
              this.category,
              this.severity,
              'Link missing text',
              `Line ${i + 1} has a link with no visible text.`,
              'Links need descriptive text for accessibility and usability.',
              page,
              i + 1,
              null,
              true,
              {
                originalContent: page.content,
                fixedContent,
                description: `Add "${linkText}" as link text.`,
                confidence: 'medium',
              },
            ),
          );
        }
      }
    }
    return diagnostics;
  },
};

export const emptyLinkTargetRule: DiagnosticRule = {
  id: 'empty-link-target',
  category: 'broken_link',
  title: 'Empty Link Target',
  description: 'A link has an empty URL target.',
  severity: 'warning',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const matches = line.match(/\[([^\]]+)\]\(\s*\)/g);
      if (matches) {
        for (const match of matches) {
          const text = match.match(/\[([^\]]+)\]/)?.[1] || '';
          const fixedContent = page.content.replace(match, `[${text}](#${text.toLowerCase().replace(/\s+/g, '-')})`);

          diagnostics.push(
            makeDiagnostic(
              this.id,
              this.category,
              this.severity,
              'Link with empty target',
              `Line ${i + 1}: Link "${text}" has no URL target.`,
              'Links need a valid URL or anchor target to be useful.',
              page,
              i + 1,
              null,
              true,
              {
                originalContent: page.content,
                fixedContent,
                description: `Add anchor target #${text.toLowerCase().replace(/\s+/g, '-')}.`,
                confidence: 'medium',
              },
            ),
          );
        }
      }
    }
    return diagnostics;
  },
};

export const lowLinkDensityRule: DiagnosticRule = {
  id: 'low-link-density',
  category: 'low_link_density',
  title: 'Low Internal Link Density',
  description: 'Page has very few internal links relative to its length.',
  severity: 'info',
  canAutoFix: false,
  detect(page) {
    const wordCount = page.content.split(/\s+/).filter(Boolean).length;
    if (wordCount < 200) return [];

    const wikiLinks = (page.content.match(/\[\[[^\]]+\]\]/g) || []).length;
    const mdLinks = (page.content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
    const totalLinks = wikiLinks + mdLinks;

    const linkDensity = totalLinks / (wordCount / 100);

    if (linkDensity < 0.5 && wordCount > 500) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          `Low link density: ${linkDensity.toFixed(1)} links per 100 words`,
          `Page has ${totalLinks} link(s) across ${wordCount} words. Consider adding cross-references.`,
          'Internal links help readers navigate related content and improve documentation structure.',
          page,
        ),
      ];
    }
    return [];
  },
};

export const highLinkDensityRule: DiagnosticRule = {
  id: 'high-link-density',
  category: 'high_link_density',
  title: 'Very High Link Density',
  description: 'Page has an unusually high number of links.',
  severity: 'info',
  canAutoFix: false,
  detect(page) {
    const wordCount = page.content.split(/\s+/).filter(Boolean).length;
    if (wordCount < 100) return [];

    const wikiLinks = (page.content.match(/\[\[[^\]]+\]\]/g) || []).length;
    const mdLinks = (page.content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
    const totalLinks = wikiLinks + mdLinks;

    const linkDensity = totalLinks / (wordCount / 100);

    if (linkDensity > 20) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          `Very high link density: ${linkDensity.toFixed(1)} links per 100 words`,
          `Page has ${totalLinks} links across ${wordCount} words (${linkDensity.toFixed(1)} per 100 words).`,
          'Too many links can distract readers. Consider grouping related links in a "See also" section.',
          page,
        ),
      ];
    }
    return [];
  },
};
