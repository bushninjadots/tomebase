import type { Diagnostic } from '@fluid/types';
import { makeDiagnostic, type DiagnosticRule } from './_infrastructure';

export const headingHierarchyRule: DiagnosticRule = {
  id: 'heading-hierarchy',
  category: 'heading_hierarchy',
  title: 'Heading Hierarchy Skipped',
  description: 'Heading levels are skipped (e.g., H1 to H3).',
  severity: 'warning',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');
    let lastLevel = 0;
    let needsFix = false;
    const fixedLines = [...lines];

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]!.match(/^(#{1,6})\s+(.*)/);
      if (match) {
        const level = match[1]!.length;
        if (lastLevel > 0 && level > lastLevel + 1) {
          needsFix = true;
          const newLevel = lastLevel + 1;
          fixedLines[i] = '#'.repeat(newLevel) + ' ' + match[2];
          diagnostics.push(
            makeDiagnostic(
              this.id,
              this.category,
              this.severity,
              `Heading level skipped: H${lastLevel} to H${level}`,
              `Heading jumps from H${lastLevel} to H${level}, skipping level(s) in between.`,
              `Heading hierarchy should be sequential (H1 > H2 > H3). Use H${lastLevel + 1} instead of H${level}.`,
              page,
              i + 1,
              null,
              true,
              {
                originalContent: page.content,
                fixedContent: fixedLines.join('\n'),
                description: `Downgrade H${level} to H${newLevel} for correct hierarchy.`,
                confidence: 'high',
              },
            ),
          );
        }
        lastLevel = level;
      }
    }
    if (!needsFix) return [];
    return diagnostics;
  },
};

export const multipleH1Rule: DiagnosticRule = {
  id: 'multiple-h1',
  category: 'multiple_h1',
  title: 'Multiple H1 Headings',
  description: 'The page has more than one H1 heading.',
  severity: 'warning',
  canAutoFix: true,
  detect(page) {
    const h1Matches = page.content.match(/^#\s+.+$/gm) || [];
    if (h1Matches.length > 1) {
      const lines = page.content.split('\n');
      const h1Lines = lines
        .map((line, i) => ({ line, index: i }))
        .filter(({ line }) => /^#\s+/.test(line));

      const fixedLines = [...lines];
      for (const { index } of h1Lines.slice(1)) {
        fixedLines[index] = fixedLines[index]!.replace(/^#/, '##');
      }

      return h1Lines.slice(1).map(({ index }) =>
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'Extra H1 heading',
          `This page has ${h1Matches.length} H1 headings. Each page should have exactly one H1.`,
          'H1 headings represent the page title. Use H2 and below for section headings within the page.',
          page,
          index + 1,
          null,
          true,
          {
            originalContent: page.content,
            fixedContent: fixedLines.join('\n'),
            description: 'Convert extra H1 headings to H2.',
            confidence: 'high',
          },
        ),
      );
    }
    return [];
  },
};

export const missingBlankLineBeforeHeadingRule: DiagnosticRule = {
  id: 'missing-blank-line-before-heading',
  category: 'missing_blank_line_before_heading',
  title: 'Missing Blank Line Before Heading',
  description: 'A heading is not preceded by a blank line.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');
    const fixedLines = [...lines];
    let needsFix = false;

    for (let i = 1; i < lines.length; i++) {
      const isHeading = /^#{1,6}\s+/.test(lines[i]!);
      const prevLine = lines[i - 1]!;
      const prevIsEmpty = prevLine.trim() === '';
      const prevIsHeading = /^#{1,6}\s+/.test(prevLine);

      if (isHeading && !prevIsEmpty && !prevIsHeading && prevLine.trim().length > 0) {
        needsFix = true;
        fixedLines.splice(i, 0, '');
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Missing blank line before heading',
            `Line ${i + 1}: Heading is not preceded by a blank line.`,
            'Headings should be preceded by a blank line for proper markdown rendering and readability.',
            page,
            i + 1,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent: fixedLines.join('\n'),
              description: 'Insert blank line before heading.',
              confidence: 'high',
            },
          ),
        );
      }
    }
    return diagnostics;
  },
};

export const missingBlankLineAfterHeadingRule: DiagnosticRule = {
  id: 'missing-blank-line-after-heading',
  category: 'missing_blank_line_after_heading',
  title: 'Missing Blank Line After Heading',
  description: 'A heading is not followed by a blank line.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');
    const fixedLines = [...lines];
    let offset = 0;

    for (let i = 0; i < lines.length - 1; i++) {
      const isHeading = /^#{1,6}\s+/.test(lines[i]!);
      const nextLine = lines[i + 1]!;
      const nextIsEmpty = nextLine.trim() === '';
      const nextIsHeading = /^#{1,6}\s+/.test(nextLine);

      if (isHeading && !nextIsEmpty && !nextIsHeading && nextLine.trim().length > 0) {
        fixedLines.splice(i + 1 + offset, 0, '');
        offset++;
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Missing blank line after heading',
            `Line ${i + 1}: Heading is not followed by a blank line.`,
            'Headings should be followed by a blank line for proper markdown rendering.',
            page,
            i + 1,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent: fixedLines.join('\n'),
              description: 'Insert blank line after heading.',
              confidence: 'high',
            },
          ),
        );
      }
    }
    return diagnostics;
  },
};

export const trailingPunctuationInHeadingRule: DiagnosticRule = {
  id: 'trailing-punctuation-in-heading',
  category: 'trailing_punctuation_in_heading',
  title: 'Trailing Punctuation in Heading',
  description: 'A heading ends with punctuation like a period or colon.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]!.match(/^(#{1,6}\s+.+?)([.,;:!?]+)$/);
      if (match) {
        const line = match[1]!;
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Heading ends with punctuation',
            `Line ${i + 1} heading ends with "${match[2]}".`,
            'Headings are titles and typically should not end with punctuation.',
            page,
            i + 1,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent: page.content.replace(
                new RegExp(`^(#{${match[1]!.match(/^#+/)![0].length}}\\s+.+?)[.,;:!?]+$`, 'm'),
                line,
              ),
              description: 'Remove trailing punctuation from heading.',
              confidence: 'high',
            },
          ),
        );
      }
    }
    return diagnostics;
  },
};

export const headingEndsWithColonRule: DiagnosticRule = {
  id: 'heading-ends-with-colon',
  category: 'heading_ends_with_colon',
  title: 'Heading Ends With Colon',
  description: 'A heading ends with a colon.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]!.match(/^(#{1,6}\s+.+):$/);
      if (match) {
        const headingHashes = match[0]!.match(/^#+/)![0];
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Heading ends with colon',
            `Line ${i + 1} heading ends with a colon.`,
            'Headings are titles and typically should not end with a colon. Consider rewording.',
            page,
            i + 1,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent: page.content.replace(
                new RegExp(`^(#{${headingHashes.length}}\\s+.+):$`, 'm'),
                '$1',
              ),
              description: 'Remove trailing colon from heading.',
              confidence: 'high',
            },
          ),
        );
      }
    }
    return diagnostics;
  },
};

export const structureDepthRule: DiagnosticRule = {
  id: 'structure-depth',
  category: 'structure_depth',
  title: 'Deep Heading Structure',
  description: 'Page has more heading levels than recommended.',
  severity: 'info',
  canAutoFix: false,
  detect(page) {
    const headings = page.content.match(/^#+/gm) || [];
    const maxLevel = Math.max(...headings.map((h) => h.length));
    if (maxLevel >= 5) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          `Deep heading structure (H${maxLevel})`,
          `Page goes down to heading level ${maxLevel}. Recommended maximum is H4.`,
          'Very deep heading levels suggest content could be restructured or split into sub-pages.',
          page,
        ),
      ];
    }
    return [];
  },
};

export const missingTocRule: DiagnosticRule = {
  id: 'missing-toc',
  category: 'missing_toc',
  title: 'Missing Table of Contents',
  description: 'A long page with multiple headings lacks a table of contents.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const headings = page.content.match(/^#{2,3}\s+.+$/gm) || [];
    const wordCount = page.content.split(/\s+/).filter(Boolean).length;

    if (headings.length >= 4 && wordCount > 1000) {
      const hasToc =
        /\[TOC\]/i.test(page.content) ||
        /##\s*(Table of Contents|Contents|TOC)/i.test(page.content) ||
        /^\s*-\s+\[#/m.test(page.content);

      if (!hasToc) {
        const firstHeading = page.content.match(/^#{2,3}\s+.+$/m);
        const line = firstHeading
          ? page.content.split('\n').findIndex((l) => l === firstHeading[0]) + 1
          : 1;

        const firstHeadingIndex = page.content.split('\n').findIndex((l) => /^#{2,3}\s+/.test(l));
        const contentLines = page.content.split('\n');
        contentLines.splice(Math.max(0, firstHeadingIndex), 0, '[TOC]', '');

        return [
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Missing table of contents',
            `This page has ${headings.length} sections and ${wordCount.toLocaleString()} words but no table of contents.`,
            'A table of contents helps readers navigate long pages. Add [TOC] or a ## Table of Contents section near the top.',
            page,
            line,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent: contentLines.join('\n'),
              description: 'Insert [TOC] marker before the first section heading.',
              confidence: 'high',
            },
          ),
        ];
      }
    }
    return [];
  },
};
