import type { Diagnostic, DiagnosticPage } from '@fluid/types';
import { makeDiagnostic, type DiagnosticRule } from './_infrastructure';

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function getSentences(text: string): string[] {
  return text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
}

function getParagraphs(content: string): string[] {
  return content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
}

function getContentWithoutFrontmatter(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match?.[1] ?? content;
}

function getHeadings(content: string): { level: number; text: string; line: number }[] {
  const lines = content.split('\n');
  const headings: { level: number; text: string; line: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match?.[1] && match[2]) {
      headings.push({ level: match[1].length, text: match[2].trim(), line: i + 1 });
    }
  }
  return headings;
}

const GENERIC_LINK_PHRASES = [
  'click here', 'read more', 'learn more', 'this link', 'this page',
  'this document', 'here', 'link', 'more info', 'more information',
  'see here', 'check this out', 'go here',
];

export const lowReadabilityRule: DiagnosticRule = {
  id: 'low-readability',
  category: 'low_readability',
  title: 'Low readability',
  description: 'Page has sentences that are too long or complex for easy reading',
  severity: 'warning',
  canAutoFix: false,
  detect(page: DiagnosticPage, _allPages: DiagnosticPage[]): Diagnostic[] {
    const body = getContentWithoutFrontmatter(page.content);
    const sentences = getSentences(body);
    if (sentences.length < 3) return [];

    const avgWordsPerSentence = countWords(body) / sentences.length;
    const longSentences = sentences.filter((s) => countWords(s) > 30);

    if (avgWordsPerSentence > 25 && longSentences.length >= 3) {
      return [makeDiagnostic(
        'low-readability',
        'low_readability',
        'warning',
        'Low readability',
        `Average sentence length is ${Math.round(avgWordsPerSentence)} words with ${longSentences.length} sentences over 30 words. Aim for shorter, clearer sentences.`,
        'Long, complex sentences make documentation harder to understand. Breaking them into shorter sentences improves comprehension, especially for non-native speakers and screen readers.',
        page,
      )];
    }
    return [];
  },
};

export const wallOfTextRule: DiagnosticRule = {
  id: 'wall-of-text',
  category: 'wall_of_text',
  title: 'Wall of text',
  description: 'Section contains a very long paragraph without visual breaks',
  severity: 'info',
  canAutoFix: false,
  detect(page: DiagnosticPage, _allPages: DiagnosticPage[]): Diagnostic[] {
    const body = getContentWithoutFrontmatter(page.content);
    const paragraphs = getParagraphs(body);
    const diagnostics: Diagnostic[] = [];

    for (const para of paragraphs) {
      const words = countWords(para);
      if (words > 250) {
        diagnostics.push(makeDiagnostic(
          'wall-of-text',
          'wall_of_text',
          'info',
          'Wall of text',
          `Paragraph with ${words} words may be hard to scan. Consider breaking it into shorter paragraphs or adding subheadings.`,
          'Long paragraphs are difficult to read on screens. Breaking content into smaller chunks with subheadings improves scannability and comprehension.',
          page,
        ));
      }
    }
    return diagnostics;
  },
};

export const missingH1Rule: DiagnosticRule = {
  id: 'missing-h1',
  category: 'missing_h1',
  title: 'Missing H1 heading',
  description: 'Page does not have an H1 heading in the content',
  severity: 'warning',
  canAutoFix: false,
  detect(page: DiagnosticPage, _allPages: DiagnosticPage[]): Diagnostic[] {
    const headings = getHeadings(page.content);
    const hasH1 = headings.some((h) => h.level === 1);

    if (!hasH1 && page.content.trim().length > 100) {
      return [makeDiagnostic(
        'missing-h1',
        'missing_h1',
        'warning',
        'Missing H1 heading',
        'Page content lacks an H1 heading. Every page should have exactly one H1 for proper document structure.',
        'H1 headings define the page title for screen readers, SEO, and document outline. Without one, the page structure is unclear.',
        page,
      )];
    }
    return [];
  },
};

export const linkTextGenericRule: DiagnosticRule = {
  id: 'link-text-generic',
  category: 'link_text_generic',
  title: 'Generic link text',
  description: 'Link uses generic text like "click here" or "read more"',
  severity: 'info',
  canAutoFix: false,
  detect(page: DiagnosticPage, _allPages: DiagnosticPage[]): Diagnostic[] {
    const lines = page.content.split('\n');
    const diagnostics: Diagnostic[] = [];
    const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      let match;
      while ((match = linkRegex.exec(line)) !== null) {
        const linkText = (match[1] ?? '').toLowerCase().trim();
        if (GENERIC_LINK_PHRASES.includes(linkText)) {
          diagnostics.push(makeDiagnostic(
            'link-text-generic',
            'link_text_generic',
            'info',
            'Generic link text',
            `Link text "${match[1]}" is generic. Use descriptive text that tells users where the link goes.`,
            'Screen readers often navigate by listing all links on a page. Generic text like "click here" gives no context about the link destination.',
            page,
            i + 1,
            match.index,
          ));
        }
      }
    }
    return diagnostics;
  },
};

export const longSlugRule: DiagnosticRule = {
  id: 'long-slug',
  category: 'long_slug',
  title: 'Slug is too long',
  description: 'Page slug is longer than 50 characters',
  severity: 'warning',
  canAutoFix: false,
  detect(page: DiagnosticPage, _allPages: DiagnosticPage[]): Diagnostic[] {
    if (page.slug.length > 50) {
      return [makeDiagnostic(
        'long-slug',
        'long_slug',
        'warning',
        'Slug is too long',
        `Slug "${page.slug}" is ${page.slug.length} characters. Shorter slugs are easier to share and remember.`,
        'Long slugs are harder to type, share in conversation, and remember. Aim for slugs under 50 characters that convey the page topic.',
        page,
      )];
    }
    return [];
  },
};

export const excessiveHeadingsRule: DiagnosticRule = {
  id: 'excessive-headings',
  category: 'excessive_headings',
  title: 'Too many headings',
  description: 'Page has more than 20 headings, suggesting over-fragmented structure',
  severity: 'info',
  canAutoFix: false,
  detect(page: DiagnosticPage, _allPages: DiagnosticPage[]): Diagnostic[] {
    const headings = getHeadings(page.content);
    if (headings.length > 20) {
      return [makeDiagnostic(
        'excessive-headings',
        'excessive_headings',
        'info',
        'Too many headings',
        `Page has ${headings.length} headings. Consider consolidating related sections for a cleaner document structure.`,
        'An excessive number of headings can make a page feel fragmented and harder to navigate. Grouping related content under fewer headings improves readability.',
        page,
      )];
    }
    return [];
  },
};

export const longParagraphRule: DiagnosticRule = {
  id: 'long-paragraph',
  category: 'long_paragraph',
  title: 'Very long paragraph',
  description: 'A single paragraph exceeds 200 words without a break',
  severity: 'warning',
  canAutoFix: false,
  detect(page: DiagnosticPage, _allPages: DiagnosticPage[]): Diagnostic[] {
    const body = getContentWithoutFrontmatter(page.content);
    const paragraphs = getParagraphs(body);
    const diagnostics: Diagnostic[] = [];

    for (const para of paragraphs) {
      const words = countWords(para);
      if (words > 200 && words <= 250) {
        diagnostics.push(makeDiagnostic(
          'long-paragraph',
          'long_paragraph',
          'warning',
          'Very long paragraph',
          `Paragraph with ${words} words could be split for better readability.`,
          'Paragraphs over 200 words are harder to read on screens. Breaking them into 2-3 shorter paragraphs with topic sentences improves scannability.',
          page,
        ));
      }
    }
    return diagnostics;
  },
};

export const deepNestingRule: DiagnosticRule = {
  id: 'deep-nesting',
  category: 'deep_nesting',
  title: 'Deeply nested content',
  description: 'Content is nested more than 4 levels deep in lists or blockquotes',
  severity: 'info',
  canAutoFix: false,
  detect(page: DiagnosticPage, _allPages: DiagnosticPage[]): Diagnostic[] {
    const lines = page.content.split('\n');
    const diagnostics: Diagnostic[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s/);
      const blockMatch = line.match(/^(\s*)(>+)\s/);

      if (listMatch?.[1] && listMatch[1].length >= 16) {
        diagnostics.push(makeDiagnostic(
          'deep-nesting',
          'deep_nesting',
          'info',
          'Deeply nested content',
          'List content is nested more than 4 levels deep. Consider flattening the structure.',
          'Deeply nested lists are hard to read and navigate. Flattening the structure or using headings instead improves usability.',
          page,
          i + 1,
        ));
        break;
      }

      if (blockMatch?.[2] && blockMatch[2].length >= 4) {
        diagnostics.push(makeDiagnostic(
          'deep-nesting',
          'deep_nesting',
          'info',
          'Deeply nested content',
          'Blockquote is nested more than 4 levels deep. Consider simplifying the structure.',
          'Deeply nested blockquotes are hard to read and may not render well on all platforms.',
          page,
          i + 1,
        ));
        break;
      }
    }
    return diagnostics;
  },
};

export const ADVANCED_RULES: DiagnosticRule[] = [
  lowReadabilityRule,
  wallOfTextRule,
  missingH1Rule,
  linkTextGenericRule,
  longSlugRule,
  excessiveHeadingsRule,
  longParagraphRule,
  deepNestingRule,
];
