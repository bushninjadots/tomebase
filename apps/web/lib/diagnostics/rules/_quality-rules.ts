import type { Diagnostic } from '@fluid/types';
import { makeDiagnostic, type DiagnosticRule } from './_infrastructure';

export const duplicateTitleRule: DiagnosticRule = {
  id: 'duplicate-title',
  category: 'duplicate_title',
  title: 'Duplicate Page Title',
  description: 'Multiple pages share the same title.',
  severity: 'warning',
  canAutoFix: false,
  detect(page, allPages) {
    const titleCounts = new Map<string, string[]>();
    for (const p of allPages) {
      const key = p.title.toLowerCase().trim();
      const existing = titleCounts.get(key) ?? [];
      existing.push(p.id);
      titleCounts.set(key, existing);
    }

    const duplicates = titleCounts.get(page.title.toLowerCase().trim());
    if (duplicates && duplicates.length > 1 && duplicates[0] === page.id) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          `Duplicate title: "${page.title}"`,
          `${duplicates.length} pages share the same title "${page.title}".`,
          'Duplicate titles create confusion and make navigation difficult. Consider renaming one of the pages to be more specific.',
          page,
          null,
          null,
          false,
        ),
      ];
    }
    return [];
  },
};

export const brokenMermaidRule: DiagnosticRule = {
  id: 'broken-mermaid',
  category: 'broken_mermaid',
  title: 'Broken Mermaid Diagram',
  description: 'A Mermaid code block has syntax issues.',
  severity: 'warning',
  canAutoFix: false,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
    let match;

    while ((match = mermaidRegex.exec(page.content)) !== null) {
      const diagram = match[1]!;
      const line = page.content.substring(0, match.index).split('\n').length;

      const hasContent = /\w/.test(diagram);
      if (!hasContent) {
        const placeholder = 'graph TD\n    A[Start] --> B[End]';
        const fixedContent = page.content.replace(
          match[0],
          '```mermaid\n' + placeholder + '\n```',
        );
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Empty Mermaid diagram',
            'The Mermaid diagram block contains no content.',
            'Mermaid diagrams need at least one node. Add diagram content between the ```mermaid fences.',
            page,
            line,
            null,
            true,
            {
              originalContent: page.content,
              fixedContent,
              description: 'Replace empty diagram with a placeholder flowchart.',
              confidence: 'medium',
            },
          ),
        );
        continue;
      }

      const diagramType = diagram.trim().split(/\s+/)[0]!;
      const validTypes = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie', 'mindmap', 'gitGraph', 'journey', 'xychart', 'block', 'sankey', 'architecture', 'packet', 'katex', 'timeline', 'sequence', 'class', 'state', 'er', 'requirement', 'c4'];
      const isKnownType = validTypes.some((t) => diagramType.startsWith(t));
      if (!isKnownType && !diagramType.startsWith('%%')) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Unrecognized Mermaid diagram type',
            `The diagram starts with "${diagramType}" which may not be a valid Mermaid type.`,
            'Check that the diagram type is valid. Common types include: graph TD, sequenceDiagram, classDiagram, erDiagram, gantt.',
            page,
            line,
          ),
        );
      }
    }
    return diagnostics;
  },
};

export const brokenImageRule: DiagnosticRule = {
  id: 'broken-image',
  category: 'broken_image',
  title: 'Broken Image Reference',
  description: 'An image link uses an invalid path.',
  severity: 'error',
  canAutoFix: false,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = imgRegex.exec(page.content)) !== null) {
      const alt = match[1]!;
      const src = match[2]!;
      const line = page.content.substring(0, match.index).split('\n').length;

      if (!src || src.trim() === '') {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Image with empty source',
            `Image "${alt || '(no alt text)'}" has no source URL.`,
            'Every image needs a valid source. Provide a URL or file path for the image.',
            page,
            line,
          ),
        );
        continue;
      }

      if (!src.startsWith('http') && !src.startsWith('/') && !src.includes('.')) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            `Likely broken image path: "${src}"`,
            `Image "${alt || '(no alt text)'}" has a path that looks incomplete.`,
            'The image path does not contain a file extension. Verify the path is correct.',
            page,
            line,
          ),
        );
      }
    }
    return diagnostics;
  },
};

export const emptyPageRule: DiagnosticRule = {
  id: 'empty-page',
  category: 'empty_page',
  title: 'Empty Page',
  description: 'This page has no content.',
  severity: 'error',
  canAutoFix: false,
  detect(page) {
    const content = page.content.replace(/^---[\s\S]*?---\s*/, '').trim();
    if (content.length === 0) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          `Empty page: "${page.title}"`,
          'This page has no content beyond frontmatter.',
          'Empty pages frustrate users and hurt documentation quality. Add content or remove the page.',
          page,
          1,
        ),
      ];
    }
    return [];
  },
};

export const largePageRule: DiagnosticRule = {
  id: 'large-page',
  category: 'large_page',
  title: 'Large Page',
  description: 'This page is significantly longer than recommended.',
  severity: 'info',
  canAutoFix: false,
  detect(page) {
    const wordCount = page.content.split(/\s+/).filter(Boolean).length;
    if (wordCount > 5000) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          `Very large page: ${wordCount.toLocaleString()} words`,
          `This page has ${wordCount.toLocaleString()} words, which exceeds the recommended maximum of 5,000.`,
          'Very long pages are hard to navigate and maintain. Consider splitting into smaller, focused pages.',
          page,
        ),
      ];
    }
    if (wordCount > 3000) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          `Large page: ${wordCount.toLocaleString()} words`,
          `This page has ${wordCount.toLocaleString()} words, approaching the recommended maximum.`,
          'Consider whether this content could be split into smaller pages for better readability.',
          page,
        ),
      ];
    }
    return [];
  },
};

export const missingCodeBlockLanguageRule: DiagnosticRule = {
  id: 'missing-code-block-language',
  category: 'missing_code_block_language',
  title: 'Code Block Missing Language',
  description: 'A fenced code block does not specify a language.',
  severity: 'warning',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');
    let inCodeBlock = false;
    const fixedLines = [...lines];
    let needsFix = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i]!.trimStart().startsWith('```')) {
        if (!inCodeBlock) {
          const fence = lines[i]!.trimStart();
          if (fence === '```' || fence === '``` ') {
            needsFix = true;
            fixedLines[i] = fixedLines[i]!.replace(/```(\s*)$/, '```text$1');
            diagnostics.push(
              makeDiagnostic(
                this.id,
                this.category,
                this.severity,
                'Code block missing language tag',
                `Line ${i + 1}: Code block opens without specifying a language.`,
                'Specifying a language enables syntax highlighting and helps readers understand the code. Add a language tag like ```javascript or ```python.',
                page,
                i + 1,
                null,
                true,
                {
                  originalContent: page.content,
                  fixedContent: fixedLines.join('\n'),
                  description: 'Add "text" as default language tag.',
                  confidence: 'high',
                },
              ),
            );
          }
          inCodeBlock = true;
        } else {
          inCodeBlock = false;
        }
      }
    }
    return diagnostics;
  },
};

export const staleDocsRule: DiagnosticRule = {
  id: 'stale-docs',
  category: 'stale_docs',
  title: 'Stale Documentation',
  description: 'This page has not been updated in a long time.',
  severity: 'warning',
  canAutoFix: false,
  detect(page) {
    const now = new Date();
    const daysSinceUpdate = Math.floor(
      (now.getTime() - new Date(page.updatedAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceUpdate > 180) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          `Very stale: ${daysSinceUpdate} days since last update`,
          `This page was last updated ${daysSinceUpdate} days ago (over 6 months).`,
          'Documentation becomes less useful over time. Review this page for accuracy and update or remove outdated content.',
          page,
        ),
      ];
    }
    if (daysSinceUpdate > 90) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          `Stale: ${daysSinceUpdate} days since last update`,
          `This page was last updated ${daysSinceUpdate} days ago.`,
          'Consider reviewing this page to ensure the information is still current and accurate.',
          page,
        ),
      ];
    }
    return [];
  },
};

export const indentedCodeBlockRule: DiagnosticRule = {
  id: 'indented-code-block',
  category: 'missing_code_block_language',
  title: 'Indented Code Block',
  description: 'Code uses indentation instead of fenced code blocks.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');
    let consecutiveIndented = 0;
    let startLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const isIndented = /^    \S/.test(lines[i]!) || /^\t\S/.test(lines[i]!);
      if (isIndented) {
        if (consecutiveIndented === 0) startLine = i;
        consecutiveIndented++;
      } else {
        if (consecutiveIndented >= 3) {
          const codeLines = lines.slice(startLine, startLine + consecutiveIndented);
          const fixedLines = [...lines];
          fixedLines.splice(startLine, consecutiveIndented, '```', ...codeLines.map((l) => l.replace(/^    /, '').replace(/^\t/, '')), '```');

          diagnostics.push(
            makeDiagnostic(
              this.id,
              this.category,
              this.severity,
              'Indented code block',
              `Lines ${startLine + 1}-${startLine + consecutiveIndented} use indented code blocks.`,
              'Fenced code blocks (```) with language tags are preferred over indented code blocks for better syntax highlighting.',
              page,
              startLine + 1,
              null,
              true,
              {
                originalContent: page.content,
                fixedContent: fixedLines.join('\n'),
                description: 'Convert indented code block to fenced code block.',
                confidence: 'high',
              },
            ),
          );
        }
        consecutiveIndented = 0;
      }
    }
    return diagnostics;
  },
};

export const horizontalRuleRule: DiagnosticRule = {
  id: 'horizontal-rule-formatting',
  category: 'deprecated_syntax',
  title: 'Inconsistent Horizontal Rule',
  description: 'Horizontal rules use inconsistent formatting.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const lines = page.content.split('\n');
    const hrVariants = new Set<string>();

    for (const line of lines) {
      if (/^[-*_]{3,}\s*$/.test(line.trim())) {
        hrVariants.add(line.trim());
      }
    }

    if (hrVariants.size > 1) {
      const fixedContent = page.content.replace(/^[-*_]{3,}\s*$/gm, '---');
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'Inconsistent horizontal rules',
          `Found ${hrVariants.size} different horizontal rule styles.`,
          'Use consistent horizontal rule formatting (--, ***, or ___) throughout the page.',
          page,
          null,
          null,
          true,
          {
            originalContent: page.content,
            fixedContent,
            description: 'Standardize all horizontal rules to "---".',
            confidence: 'high',
          },
        ),
      ];
    }
    return [];
  },
};

export const longLineLengthRule: DiagnosticRule = {
  id: 'long-line-length',
  category: 'large_page',
  title: 'Line Too Long',
  description: 'A line exceeds the recommended maximum length.',
  severity: 'info',
  canAutoFix: false,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i]!.length > 120 && !/```/.test(lines[i]!) && !lines[i]!.startsWith('|')) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            `Very long line (${lines[i]!.length} chars)`,
            `Line ${i + 1} exceeds 120 characters.`,
            'Long lines are harder to read in side-by-side diffs. Consider breaking them up.',
            page,
            i + 1,
          ),
        );
      }
    }
    return diagnostics;
  },
};

export const tableMissingHeaderRule: DiagnosticRule = {
  id: 'table-missing-header',
  category: 'table_missing_header',
  title: 'Table Missing Header',
  description: 'A table does not have a proper header row.',
  severity: 'warning',
  canAutoFix: false,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');

    for (let i = 0; i < lines.length - 1; i++) {
      const isTableLine = lines[i]!.startsWith('|') && lines[i]!.endsWith('|');
      if (!isTableLine) continue;

      const nextLine = lines[i + 1]!;
      const isSeparator = /^\|[\s:-]+\|/.test(nextLine);

      if (!isSeparator) continue;

      const cells = lines[i]!.split('|').filter((c) => c.trim().length > 0);
      const allEmpty = cells.every((c) => c.trim().length === 0);
      if (allEmpty || cells.length === 0) {
        diagnostics.push(
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            'Table missing header content',
            `Line ${i + 1}: A table's header row is empty or missing.`,
            'Tables should have descriptive header rows for clarity and accessibility.',
            page,
            i + 1,
          ),
        );
      }
    }
    return diagnostics;
  },
};

export const tableInconsistentColumnsRule: DiagnosticRule = {
  id: 'table-inconsistent-columns',
  category: 'table_inconsistent_columns',
  title: 'Table Has Inconsistent Columns',
  description: 'A table has rows with different numbers of columns.',
  severity: 'warning',
  canAutoFix: false,
  detect(page) {
    const diagnostics: Diagnostic[] = [];
    const lines = page.content.split('\n');
    let inTable = false;
    let expectedColumns = 0;
    let tableStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const isTableLine = lines[i]!.startsWith('|') && lines[i]!.endsWith('|');
      const isSeparator = /^\|[\s:-]+\|/.test(lines[i]!);

      if (isTableLine && !isSeparator) {
        if (!inTable) {
          inTable = true;
          tableStart = i;
          expectedColumns = lines[i]!.split('|').filter((c) => c.trim().length > 0).length;
        } else {
          const cols = lines[i]!.split('|').filter((c) => c.trim().length > 0).length;
          if (cols !== expectedColumns && !isSeparator) {
            diagnostics.push(
              makeDiagnostic(
                this.id,
                this.category,
                this.severity,
                `Inconsistent columns: expected ${expectedColumns}, got ${cols}`,
                `Line ${i + 1} has ${cols} columns but the table started with ${expectedColumns} columns.`,
                'All rows in a table should have the same number of columns.',
                page,
                i + 1,
              ),
            );
          }
        }
      } else if (inTable && !isTableLine) {
        inTable = false;
      }
    }
    return diagnostics;
  },
};

export const missingCodeExamplesRule: DiagnosticRule = {
  id: 'missing-code-examples',
  category: 'missing_code_examples',
  title: 'Missing Code Examples',
  description: 'Technical page lacks code examples.',
  severity: 'info',
  canAutoFix: false,
  detect(page) {
    const wordCount = page.content.split(/\s+/).filter(Boolean).length;
    if (wordCount < 300) return [];

    const hasCodeTerms = /\b(function|class|interface|type|api|endpoint|method|sdk|library|import|export|config)\b/i.test(page.content);
    const codeBlocks = (page.content.match(/```\w*/g) || []).length;
    const hasExamples = codeBlocks >= 2;

    if (hasCodeTerms && !hasExamples) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'Technical content without code examples',
          `Page mentions code concepts but has no code examples.`,
          'Code examples make technical documentation more useful. Add practical examples showing usage.',
          page,
        ),
      ];
    }
    return [];
  },
};

export const tooManyDiagramsRule: DiagnosticRule = {
  id: 'too-many-diagrams',
  category: 'too_many_diagrams',
  title: 'Many Mermaid Diagrams',
  description: 'Page has an excessive number of diagrams.',
  severity: 'info',
  canAutoFix: false,
  detect(page) {
    const mermaidCount = (page.content.match(/```mermaid\n/g) || []).length;
    if (mermaidCount > 5) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          `${mermaidCount} mermaid diagrams on this page`,
          `This page has ${mermaidCount} mermaid diagrams, which may impact loading time.`,
          'Consider splitting diagrams across multiple pages if there are more than 5.',
          page,
        ),
      ];
    }
    return [];
  },
};

export const codeLanguageDiversityRule: DiagnosticRule = {
  id: 'code-language-diversity',
  category: 'code_language_diversity',
  title: 'Low Code Language Diversity',
  description: 'Multiple code blocks all use the same language in a multi-language project.',
  severity: 'info',
  canAutoFix: false,
  detect(page) {
    const langRegex = /```(\w+)/g;
    const languages = new Set<string>();
    let match;
    while ((match = langRegex.exec(page.content)) !== null) {
      if (match[1] && match[1] !== 'mermaid' && match[1] !== 'text') {
        languages.add(match[1]!);
      }
    }

    if (languages.size === 1) {
      const codeBlockCount = (page.content.match(/```/g) || []).length / 2;
      if (codeBlockCount >= 3) {
        return [
          makeDiagnostic(
            this.id,
            this.category,
            this.severity,
            `All ${codeBlockCount} code blocks use ${[...languages][0]}`,
            `This page has ${codeBlockCount} code blocks, all in ${[...languages][0]}. Consider showing examples in other languages.`,
            'Showing code examples in multiple languages improves accessibility for diverse audiences.',
            page,
          ),
        ];
      }
    }
    return [];
  },
};

export const missingRelatedPagesRule: DiagnosticRule = {
  id: 'missing-related-pages',
  category: 'missing_related_pages',
  title: 'No Related Pages Section',
  description: 'A longer page with multiple sections lacks a "See also" or related pages section.',
  severity: 'info',
  canAutoFix: false,
  detect(page, allPages) {
    const wordCount = page.content.split(/\s+/).filter(Boolean).length;
    if (wordCount < 500 || allPages.length < 3) return [];

    const hasSeeAlso = /\b(See also|Related|Further reading|Next steps|Learn more)\b/i.test(page.content);
    if (!hasSeeAlso) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'No "See also" section',
          `Long page (${wordCount} words) with no related pages section.`,
          'Adding a "See also" section at the bottom helps readers discover related content.',
          page,
        ),
      ];
    }
    return [];
  },
};
