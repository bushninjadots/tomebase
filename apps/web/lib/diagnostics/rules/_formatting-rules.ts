import type { Diagnostic } from '@fluid/types';
import { makeDiagnostic, type DiagnosticRule } from './_infrastructure';

export const invalidMarkdownRule: DiagnosticRule = {
  id: 'invalid-markdown',
  category: 'invalid_markdown',
  title: 'Invalid Markdown',
  description: 'The page contains malformed markdown syntax.',
  severity: 'error',
  canAutoFix: false,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (line.trimStart().startsWith('```')) {
        let fenceCount = 0;
        for (let j = i; j < lines.length; j++) {
          if (lines[j]!.trimStart().startsWith('```')) fenceCount++;
        }
        if (fenceCount % 2 !== 0) {
          diagnostics.push(
            makeDiagnostic(
              this.id,
              this.category,
              this.severity,
              'Unclosed code block',
              'A code block (```) is opened but never closed.',
              'Every opening ``` must have a corresponding closing ```. Add the missing closing fence.',
              page,
              i + 1,
            ),
          );
          break;
        }
      }

      const boldOpen = (line.match(/\*\*/g) || []).length;
      if (boldOpen % 2 !== 0 && !line.includes('```')) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Mismatched bold markers',
            `Line has an odd number of ** markers (${boldOpen}).`,
            'Bold text requires matching pairs of **. Check for missing or extra asterisks.',
            page,
            i + 1,
          ),
        );
      }
    }
    return diagnostics;
  },
};

export const duplicateBlankLinesRule: DiagnosticRule = {
  id: 'duplicate-blank-lines',
  category: 'duplicate_blank_lines',
  title: 'Duplicate Blank Lines',
  description: 'The page contains consecutive empty lines.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');
    let consecutiveBlanks = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i]!.trim() === '') {
        consecutiveBlanks++;
        if (consecutiveBlanks > 1) {
          const fixedContent = page.content.replace(/\n{3,}/g, '\n\n');
          diagnostics.push(
            makeDiagnostic(
              this.id,
              this.category,
              this.severity,
              'Multiple consecutive blank lines',
              `Found ${consecutiveBlanks} consecutive blank lines starting at line ${i + 1}.`,
              'Multiple blank lines add visual noise without improving readability. Keep single blank lines between sections.',
              page,
              i + 1,
              null,
              true,
              {
                originalContent: page.content,
                fixedContent,
                description: 'Collapse multiple consecutive blank lines into single blank lines.',
                confidence: 'high',
              },
            ),
          );
          break;
        }
      } else {
        consecutiveBlanks = 0;
      }
    }
    return diagnostics;
  },
};

export const trailingWhitespaceRule: DiagnosticRule = {
  id: 'trailing-whitespace',
  category: 'trailing_whitespace',
  title: 'Trailing Whitespace',
  description: 'Lines end with unnecessary whitespace.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const lines = page.content.split('\n');
    const trailingLines: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i] !== lines[i]!.trimEnd() && lines[i]!.trim().length > 0) {
        trailingLines.push(i + 1);
      }
    }

    if (trailingLines.length > 0) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          `${trailingLines.length} line${trailingLines.length === 1 ? '' : 's'} with trailing whitespace`,
          `Lines ${trailingLines.slice(0, 5).join(', ')}${trailingLines.length > 5 ? '...' : ''} have trailing whitespace.`,
          'Trailing whitespace is invisible but clutters diffs and version history. Remove it for cleaner version control.',
          page,
          trailingLines[0],
          null,
          true,
          {
            originalContent: page.content,
            fixedContent: page.content.split('\n').map((l) => l.trimEnd()).join('\n'),
            description: 'Remove trailing whitespace from all lines.',
            confidence: 'high',
          },
        ),
      ];
    }
    return [];
  },
};

export const markdownFormattingRule: DiagnosticRule = {
  id: 'markdown-formatting',
  category: 'markdown_formatting',
  title: 'Markdown Formatting Issues',
  description: 'Common markdown formatting problems detected.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      const headingMatch = line.match(/^(#{1,6})([^\s#])/);
      if (headingMatch) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Heading missing space after #',
            `Line ${i + 1}: "${line.slice(0, 40)}..." has no space after the heading marker.`,
            'Standard markdown requires a space after the # symbols in headings.',
            page,
            i + 1,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent: page.content.replace(
                new RegExp(`^(#{${headingMatch[1]!.length}})([^\s#])`, 'm'),
                '$1 $2',
              ),
              description: 'Add space between heading markers and text.',
              confidence: 'high',
            },
          ),
        );
      }

      if (/^[-*+]\S/.test(line.trim()) && !line.trim().startsWith('```')) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'List item missing space',
            `Line ${i + 1}: List marker not followed by a space.`,
            'List items require a space after the marker (-, *, +, or number).',
            page,
            i + 1,
          ),
        );
      }
    }
    return diagnostics;
  },
};

export const deprecatedSyntaxRule: DiagnosticRule = {
  id: 'deprecated-syntax',
  category: 'deprecated_syntax',
  title: 'Deprecated Syntax',
  description: 'The page uses deprecated or legacy markdown syntax.',
  severity: 'warning',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (/<details>/i.test(line)) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Raw HTML in markdown',
            `Line ${i + 1}: Uses raw HTML <details> tag.`,
            'While HTML is valid in markdown, prefer markdown-native syntax where possible for better portability.',
            page,
            i + 1,
          ),
        );
      }

      if (/(?<!\w)__(?!_)(.+?)__(?!_)/.test(line) && !/```/.test(line)) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Deprecated bold syntax',
            `Line ${i + 1}: Uses __text__ for bold instead of **text**.`,
            'While __text__ still works, **text** is the more widely supported syntax for bold in modern markdown.',
            page,
            i + 1,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent: page.content.replace(/__(.+?)__/g, '**$1**'),
              description: 'Replace __bold__ with **bold** syntax.',
              confidence: 'medium',
            },
          ),
        );
      }

      if (/(?<![_\w])_(?!_)(.+?)_(?![_\w])/.test(line) && !/```/.test(line) && !/\[.*\]\(.*\)/.test(line)) {
        if (/(?<!\w)_[A-Z].+?_(?!\w)/.test(line)) {
          diagnostics.push(
            makeDiagnostic(
              this.id,
              this.category,
              this.severity,
              'Deprecated italic syntax',
              `Line ${i + 1}: Uses _text_ for italic instead of *text*.`,
              'While _text_ still works, *text* is the more common convention.',
              page,
              i + 1,
            ),
          );
        }
      }
    }
    return diagnostics;
  },
};

export const inconsistentListMarkersRule: DiagnosticRule = {
  id: 'inconsistent-list-markers',
  category: 'inconsistent_list_markers',
  title: 'Inconsistent List Markers',
  description: 'The page mixes different list markers (-, *, +).',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const lines = page.content.split('\n');
    const markers = new Set<string>();

    for (const line of lines) {
      const match = line.trim().match(/^([-*+])\s+\S/);
      if (match) markers.add(match[1]!);
    }

    if (markers.size > 1) {
      const dominant = markers.has('-') ? '-' : markers.has('*') ? '*' : '+';
      const fixedContent = page.content.replace(/^(\s*)([*+])\s+/gm, `$1${dominant} `);

      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'Mixed list markers',
          `The page uses ${markers.size} different list markers: ${[...markers].join(', ')}.`,
          'Consistent list markers improve readability. Standardize on one marker style.',
          page,
          null,
          null,
          true,
          {
            originalContent: page.content,
            fixedContent,
            description: `Normalize all list markers to "${dominant}".`,
            confidence: 'high',
          },
        ),
      ];
    }
    return [];
  },
};

export const multipleSpacesRule: DiagnosticRule = {
  id: 'multiple-spaces',
  category: 'multiple_spaces',
  title: 'Multiple Consecutive Spaces',
  description: 'Lines contain multiple consecutive spaces (not indentation).',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.includes('  ') && !line.startsWith(' ') && !/```/.test(line) && !/^\s*[-*+]\s/.test(line)) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Multiple spaces',
            `Line ${i + 1} contains multiple consecutive spaces.`,
            'Multiple spaces between words are typically typos. Use a single space.',
            page,
            i + 1,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent: page.content.replace(/(?<!\n)([^\n])  +/g, '$1 '),
              description: 'Collapse multiple spaces to single space.',
              confidence: 'high',
            },
          ),
        );
        break;
      }
    }
    return diagnostics;
  },
};

export const missingNewlineEofRule: DiagnosticRule = {
  id: 'missing-newline-eof',
  category: 'missing_newline_eof',
  title: 'Missing Newline at End of File',
  description: 'The file does not end with a newline character.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const content = page.content;
    if (content.length > 0 && !content.endsWith('\n')) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'No trailing newline',
          'File does not end with a newline character.',
          'POSIX standard recommends files end with a newline. Some tools may behave unexpectedly without it.',
          page,
          content.split('\n').length,
          null,
          true,
          {
            originalContent: content,
            fixedContent: content + '\n',
            description: 'Append newline at end of file.',
            confidence: 'high',
          },
        ),
      ];
    }
    return [];
  },
};

export const missingAltTextRule: DiagnosticRule = {
  id: 'missing-alt-text',
  category: 'missing_alt_text',
  title: 'Image Missing Alt Text',
  description: 'An image is missing alternative text.',
  severity: 'warning',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const imgRegex = /!\[\s*\]\(([^)]+)\)/g;
    let match;

    while ((match = imgRegex.exec(page.content)) !== null) {
      const src = match[1]!;
      const line = page.content.substring(0, match.index).split('\n').length;
      const filename = src.split('/').pop()?.replace(/\.[^.]+$/, '') || 'image';
      const altText = filename.replace(/[-_]/g, ' ');
      const fixedContent = page.content.replace(match[0], `![${altText}](${src})`);

      diagnostics.push(
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'Image missing alt text',
          `Image "${src}" has empty alt text.`,
          'Alt text is essential for accessibility and SEO. Describe what the image shows.',
          page,
          line,
          null,
          true,
          {
            originalContent: page.content,
            fixedContent,
            description: `Add "${altText}" as alt text from filename.`,
            confidence: 'medium',
          },
        ),
      );
    }
    return diagnostics;
  },
};

export const inconsistentEmphasisRule: DiagnosticRule = {
  id: 'inconsistent-emphasis',
  category: 'inconsistent_emphasis',
  title: 'Inconsistent Emphasis Style',
  description: 'The page mixes * and _ for emphasis.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const content = page.content;
    const lines = content.split('\n');
    let asteriskBold = 0;
    let underscoreBold = 0;
    let asteriskItalic = 0;
    let underscoreItalic = 0;

    for (const line of lines) {
      if (/```/.test(line)) continue;
      asteriskBold += (line.match(/\*\*[^*]+\*\*/g) || []).length;
      underscoreBold += (line.match(/__(?!_).+?__/g) || []).length;
      asteriskItalic += (line.match(/(?<!\*)\*(?!\*)[^*]+\*(?!\*)/g) || []).length;
      underscoreItalic += (line.match(/(?<!_)_(?!_)[^_]+_(?!_)/g) || []).length;
    }

    const useAsterisk = asteriskBold + asteriskItalic > underscoreBold + underscoreItalic;
    const hasMixed = (asteriskBold > 0 && underscoreBold > 0) || (asteriskItalic > 0 && underscoreItalic > 0);

    if (hasMixed) {
      let fixedContent = content;
      if (!useAsterisk) {
        fixedContent = fixedContent.replace(/\*\*([^*]+)\*\*/g, '__$1__');
      } else {
        fixedContent = fixedContent.replace(/__(.+?)__/g, '**$1**');
      }

      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'Mixed emphasis styles',
          'The page uses both * and _ for emphasis.',
          'Use consistent emphasis markers throughout a page for cleaner markdown.',
          page,
          null,
          null,
          true,
          {
            originalContent: content,
            fixedContent,
            description: `Standardize emphasis to ${useAsterisk ? 'asterisks (*)' : 'underscores (_)'}.`,
            confidence: 'medium',
          },
        ),
      ];
    }
    return [];
  },
};

export const spaceBeforePunctuationRule: DiagnosticRule = {
  id: 'space-before-punctuation',
  category: 'space_before_punctuation',
  title: 'Space Before Punctuation',
  description: 'There is a space before a period, comma, or other punctuation.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/```/.test(line) || line.startsWith('|')) continue;

      const matches = line.match(/\s+[.,;:!?]/g);
      if (matches && matches.length > 0) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Space before punctuation',
            `Line ${i + 1} has a space before punctuation.`,
            'Remove the space before punctuation marks.',
            page,
            i + 1,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent: page.content.replace(/(\S)\s+([.,;:!?])/g, '$1$2'),
              description: 'Remove spaces before punctuation.',
              confidence: 'high',
            },
          ),
        );
        break;
      }
    }
    return diagnostics;
  },
};

export const doublePunctuationRule: DiagnosticRule = {
  id: 'double-punctuation',
  category: 'double_punctuation',
  title: 'Double Punctuation',
  description: 'Consecutive duplicate punctuation marks found.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/```/.test(line)) continue;

      const matches = line.match(/([.,;:!?])\1+/g);
      if (matches) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Double punctuation',
            `Line ${i + 1} has consecutive punctuation: "${matches[0]}".`,
            'Double punctuation is likely a typo. Use a single punctuation mark.',
            page,
            i + 1,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent: page.content.replace(/([.,;:!?])\1+/g, '$1'),
              description: 'Remove duplicate punctuation marks.',
              confidence: 'medium',
            },
          ),
        );
        break;
      }
    }
    return diagnostics;
  },
};

export const htmlEntitiesRule: DiagnosticRule = {
  id: 'html-entities',
  category: 'html_entities',
  title: 'HTML Entities in Markdown',
  description: 'HTML entities found that could be plain text.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const entityMap: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&apos;': "'",
      '&nbsp;': ' ',
      '&mdash;': '—',
      '&ndash;': '–',
      '&hellip;': '…',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™',
      '&euro;': '€',
      '&pound;': '£',
      '&yen;': '¥',
      '&times;': '×',
      '&divide;': '÷',
    };

    let fixedContent = page.content;
    for (const [entity, char] of Object.entries(entityMap)) {
      if (fixedContent.includes(entity)) {
        fixedContent = fixedContent.replaceAll(entity, char);
      }
    }

    if (fixedContent !== page.content) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'HTML entities found',
          'The page contains HTML entities that could be plain text.',
          'In markdown, you can usually use the character directly instead of HTML entities.',
          page,
          null,
          null,
          true,
          {
            originalContent: page.content,
            fixedContent,
            description: 'Replace HTML entities with their character equivalents.',
            confidence: 'high',
          },
        ),
      ];
    }
    return [];
  },
};

export const missingSpaceAfterPunctuationRule: DiagnosticRule = {
  id: 'missing-space-after-punctuation',
  category: 'missing_space_after_punctuation',
  title: 'Missing Space After Punctuation',
  description: 'A period, comma, or other punctuation is not followed by a space.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/```/.test(line) || line.startsWith('|') || line.startsWith('#')) continue;

      const matches = line.match(/[.,;:!?][a-zA-Z]/g);
      if (matches && matches.length > 0) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Missing space after punctuation',
            `Line ${i + 1} has punctuation not followed by a space.`,
            'Add a space after punctuation marks for proper formatting.',
            page,
            i + 1,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent: page.content.replace(/([.,;:!?])([a-zA-Z])/g, '$1 $2'),
              description: 'Add space after punctuation.',
              confidence: 'high',
            },
          ),
        );
        break;
      }
    }
    return diagnostics;
  },
};

export const blankLineInBlockquoteRule: DiagnosticRule = {
  id: 'blank-line-in-blockquote',
  category: 'blank_line_in_blockquote',
  title: 'Blank Line in Blockquote',
  description: 'A blockquote contains unnecessary blank lines.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');
    let inBlockquote = false;
    let blockquoteStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const isBlockquote = /^>\s*/.test(lines[i]!);
      const isEmpty = lines[i]!.trim() === '';

      if (isBlockquote) {
        if (!inBlockquote) {
          inBlockquote = true;
          blockquoteStart = i;
        }
      } else if (inBlockquote && isEmpty) {
        inBlockquote = false;
      } else if (inBlockquote && !isBlockquote) {
        inBlockquote = false;
      }
    }

    const fixedContent = page.content.replace(/^(>.*$)\n\n(>)/gm, '$1\n$2');
    if (fixedContent !== page.content) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'Blank line in blockquote',
          'A blockquote contains an unnecessary blank line.',
          'Blank lines break the visual flow of blockquotes. Remove them for cleaner formatting.',
          page,
          null,
          null,
          true,
          {
            originalContent: page.content,
            fixedContent,
            description: 'Remove blank lines within blockquotes.',
            confidence: 'high',
          },
        ),
      ];
    }
    return diagnostics;
  },
};

export const missingClosingBacktickRule: DiagnosticRule = {
  id: 'missing-closing-backtick',
  category: 'missing_closing_backtick',
  title: 'Missing Closing Backtick',
  description: 'An inline code span has mismatched backticks.',
  severity: 'error',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/```/.test(line)) continue;

      const backtickCount = (line.match(/(?<!`)`(?!`)/g) || []).length;
      if (backtickCount % 2 !== 0) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Mismatched inline code backtick',
            `Line ${i + 1} has an odd number of backticks (${backtickCount}).`,
            'Inline code requires matching pairs of backticks. Add the missing closing backtick.',
            page,
            i + 1,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent: page.content + '`',
              description: 'Add closing backtick at end of line.',
              confidence: 'low',
            },
          ),
        );
      }
    }
    return diagnostics;
  },
};

export const unspacedBlockquoteRule: DiagnosticRule = {
  id: 'unspaced-blockquote',
  category: 'unspaced_blockquote',
  title: 'Blockquote Missing Space',
  description: 'A blockquote marker (>) is not followed by a space.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]!.match(/^>(\S)/);
      if (match) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Blockquote missing space',
            `Line ${i + 1}: ">" is not followed by a space.`,
            'Standard markdown requires a space after the > marker in blockquotes.',
            page,
            i + 1,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent: page.content.replace(new RegExp(`^(>{match[0]!.length - 1})([^\\s])`, 'm'), '$1 $2'),
              description: 'Add space after > blockquote marker.',
              confidence: 'high',
            },
          ),
        );
      }
    }
    return diagnostics;
  },
};

export const repeatedWordsRule: DiagnosticRule = {
  id: 'repeated-words',
  category: 'repeated_words',
  title: 'Repeated Words',
  description: 'Consecutive duplicate words found.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/```/.test(line)) continue;

      const matches = line.match(/\b(\w+)\s+\1\b/gi);
      if (matches) {
        for (const match of matches) {
          const word = match.split(/\s+/)[0]!.toLowerCase();
          const intentional = ['had', 'that', 'is', 'can', 'do'];
          if (intentional.includes(word)) continue;

          const repeatedWord = match.split(/\s+/)[0]!;
          diagnostics.push(
            makeDiagnostic(
              this.id,
              this.category,
              this.severity,
              `Repeated word: "${repeatedWord}"`,
              `Line ${i + 1} contains the repeated word "${repeatedWord}".`,
              `"${repeatedWord}" appears twice in a row. Remove the duplicate.`,
              page,
              i + 1,
              null,
              true,
              {
                originalContent: page.content,
                fixedContent: page.content.replace(
                  new RegExp(`\\b(${repeatedWord})\\s+\\1\\b`, 'gi'),
                  '$1',
                ),
                description: `Remove duplicate word "${repeatedWord}".`,
                confidence: 'medium',
              },
            ),
          );
          break;
        }
      }
    }
    return diagnostics;
  },
};

export const missingSpaceAroundInlineCodeRule: DiagnosticRule = {
  id: 'missing-space-around-inline-code',
  category: 'missing_space_around_inline_code',
  title: 'Missing Space Around Inline Code',
  description: 'Inline code is not separated from surrounding text.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/```/.test(line)) continue;

      const matches = line.match(/\w`[^`]+`\w|`[^`]+`\w|\w`[^`]+`/g);
      if (matches) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Missing space around inline code',
            `Line ${i + 1}: Inline code is not separated from text.`,
            'Inline code should be separated from surrounding text with spaces for readability.',
            page,
            i + 1,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent: page.content.replace(/(\w)(`[^`]+`)(\w)/g, '$1 $2 $3')
                .replace(/(\w)(`[^`]+`)/g, '$1 $2')
                .replace(/(`[^`]+`)(\w)/g, '$1 $2'),
              description: 'Add spaces around inline code.',
              confidence: 'high',
            },
          ),
        );
        break;
      }
    }
    return diagnostics;
  },
};
