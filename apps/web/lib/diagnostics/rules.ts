import type {
  Diagnostic,
  DiagnosticCategory,
  DiagnosticSeverity,
  DiagnosticPage,
  FixPreview,
} from '@fluid/types';

export interface DiagnosticRule {
  id: string;
  category: DiagnosticCategory;
  title: string;
  description: string;
  severity: DiagnosticSeverity;
  canAutoFix: boolean;
  detect(page: DiagnosticPage, allPages: DiagnosticPage[]): Diagnostic[];
}

let diagnosticCounter = 0;

export function resetDiagnosticCounter(): void {
  diagnosticCounter = 0;
}

function makeDiagnostic(
  ruleId: string,
  category: DiagnosticCategory,
  severity: DiagnosticSeverity,
  title: string,
  description: string,
  explanation: string,
  page: DiagnosticPage,
  line: number | null = null,
  column: number | null = null,
  canAutoFix: boolean = false,
  fixPreview: FixPreview | null = null,
): Diagnostic {
  diagnosticCounter++;
  return {
    id: `diag-${diagnosticCounter}`,
    category,
    severity,
    title,
    description,
    explanation,
    pageId: page.id,
    pageSlug: page.slug,
    pageTitle: page.title,
    line,
    column,
    rule: ruleId,
    canAutoFix,
    fixPreview,
    aiAvailable: false,
    ignored: false,
    createdAt: new Date().toISOString(),
  };
}

function findLineNumber(content: string, searchText: string): number | null {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]!.includes(searchText)) return i + 1;
  }
  return null;
}

function findLineMatching(content: string, predicate: (line: string, index: number) => boolean): number | null {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (predicate(lines[i]!, i)) return i + 1;
  }
  return null;
}

// Rule 1: Broken Wiki Links
const brokenLinkRule: DiagnosticRule = {
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

// Rule 2: Missing Frontmatter
const missingFrontmatterRule: DiagnosticRule = {
  id: 'missing-frontmatter',
  category: 'missing_frontmatter',
  title: 'Missing Frontmatter',
  description: 'Page content does not start with YAML frontmatter.',
  severity: 'warning',
  canAutoFix: true,
  detect(page) {
    if (!page.content.trimStart().startsWith('---')) {
      const firstContentLine = page.content.split('\n').findIndex((l) => l.trim().length > 0);
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'Missing YAML frontmatter',
          'This page does not have a YAML frontmatter block at the top.',
          'Frontmatter provides structured metadata for your documentation. Add a --- block at the top with title, description, and other fields.',
          page,
          firstContentLine >= 0 ? firstContentLine + 1 : 1,
          null,
          true,
          {
            originalContent: page.content,
            fixedContent: `---\ntitle: "${page.title}"\ndescription: ""\ntags: []\n---\n\n${page.content}`,
            description: 'Add empty frontmatter block with title, description, and tags fields.',
            confidence: 'medium',
          },
        ),
      ];
    }
    return [];
  },
};

// Rule 3: Missing Title (in frontmatter)
const missingTitleRule: DiagnosticRule = {
  id: 'missing-title',
  category: 'missing_title',
  title: 'Missing Title in Frontmatter',
  description: 'Frontmatter exists but does not include a title field.',
  severity: 'warning',
  canAutoFix: true,
  detect(page) {
    const content = page.content;
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return [];

    const frontmatter = frontmatterMatch[1]!;
    if (!/^title\s*:/m.test(frontmatter)) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'Missing title in frontmatter',
          'The frontmatter block does not contain a title field.',
          'The title field helps with SEO and navigation. Add title: "Your Page Title" to the frontmatter.',
          page,
          1,
          null,
          true,
          {
            originalContent: content,
            fixedContent: content.replace(/^---\n/, `---\ntitle: "${page.title}"\n`),
            description: `Add title: "${page.title}" to frontmatter.`,
            confidence: 'high',
          },
        ),
      ];
    }
    return [];
  },
};

// Rule 4: Missing Description (in frontmatter)
const missingDescriptionRule: DiagnosticRule = {
  id: 'missing-description',
  category: 'missing_description',
  title: 'Missing Description in Frontmatter',
  description: 'Frontmatter exists but does not include a description field.',
  severity: 'warning',
  canAutoFix: true,
  detect(page) {
    const content = page.content;
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return [];

    const frontmatter = frontmatterMatch[1]!;
    if (!/^description\s*:/m.test(frontmatter)) {
      const frontmatterEnd = content.indexOf('---', content.indexOf('---') + 3);
      const line = content.substring(0, frontmatterEnd).split('\n').length;
      // Insert description after title line in frontmatter
      const descriptionLine = 'description: ""';
      const updatedContent = content.replace(
        /^(---\n(?:title:.*\n)?)/m,
        `$1${descriptionLine}\n`,
      );
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'Missing description in frontmatter',
          'The frontmatter block does not contain a description field.',
          'A description helps with SEO and provides context when pages are linked. Add a brief description of this page.',
          page,
          line,
          null,
          true,
          {
            originalContent: content,
            fixedContent: updatedContent,
            description: 'Add empty description field to frontmatter.',
            confidence: 'high',
          },
        ),
      ];
    }
    return [];
  },
};

// Rule 5: Missing Owner
const missingOwnerRule: DiagnosticRule = {
  id: 'missing-owner',
  category: 'missing_owner',
  title: 'Missing Owner',
  description: 'No owner or author is specified for this page.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const content = page.content;
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return [];

    const frontmatter = frontmatterMatch[1]!;
    const hasOwner = /^owner\s*:/m.test(frontmatter) || /^author\s*:/m.test(frontmatter);
    if (!hasOwner) {
      const updatedContent = content.replace(
        /^(---\n[\s\S]*?)(\n---)/m,
        '$1\nowner: ""$2',
      );
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'No owner specified',
          'This page does not have an owner or author assigned.',
          'Assigning an owner makes it clear who is responsible for keeping this documentation up to date.',
          page,
          1,
          null,
          true,
          {
            originalContent: content,
            fixedContent: updatedContent,
            description: 'Add empty owner field to frontmatter.',
            confidence: 'high',
          },
        ),
      ];
    }
    return [];
  },
};

// Rule 6: Missing Tags
const missingTagsRule: DiagnosticRule = {
  id: 'missing-tags',
  category: 'missing_tags',
  title: 'Missing Tags',
  description: 'No tags are specified for this page.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const content = page.content;
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return [];

    const frontmatter = frontmatterMatch[1]!;
    const hasTags = /^tags\s*:/m.test(frontmatter) || /^categories\s*:/m.test(frontmatter);
    if (!hasTags) {
      const updatedContent = content.replace(
        /^(---\n[\s\S]*?)(\n---)/m,
        '$1\ntags: []$2',
      );
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'No tags specified',
          'This page does not have any tags assigned.',
          'Tags help organize documentation and make it easier to find related pages.',
          page,
          1,
          null,
          true,
          {
            originalContent: content,
            fixedContent: updatedContent,
            description: 'Add empty tags array to frontmatter.',
            confidence: 'high',
          },
        ),
      ];
    }
    return [];
  },
};

// Rule 7: Duplicate Titles
const duplicateTitleRule: DiagnosticRule = {
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

// Rule 8: Invalid Markdown
const invalidMarkdownRule: DiagnosticRule = {
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

      // Unclosed code blocks (odd number of ``` fences)
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

      // Mismatched bold markers
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

// Rule 9: Broken Mermaid
const brokenMermaidRule: DiagnosticRule = {
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

      // Basic validation: diagram should have at least one node/arrow
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

      // Check for common mermaid diagram types
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

// Rule 10: Broken Images
const brokenImageRule: DiagnosticRule = {
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

      // Check for empty src
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

      // Check for obviously broken paths (local files without extension)
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

// Rule 11: Empty Pages
const emptyPageRule: DiagnosticRule = {
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

// Rule 12: Orphan Pages
const orphanPageRule: DiagnosticRule = {
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

// Rule 13: Unlinked Pages (alias for orphan - broader detection)
const unlinkedPageRule: DiagnosticRule = {
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

// Rule 14: Large Pages
const largePageRule: DiagnosticRule = {
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

// Rule 15: Heading Hierarchy
const headingHierarchyRule: DiagnosticRule = {
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
          // Downgrade heading to correct level
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

// Rule 16: Multiple H1
const multipleH1Rule: DiagnosticRule = {
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

      // Convert extra H1s to H2s
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

// Rule 17: Duplicate Blank Lines
const duplicateBlankLinesRule: DiagnosticRule = {
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

// Rule 18: Trailing Whitespace
const trailingWhitespaceRule: DiagnosticRule = {
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

// Rule 19: Markdown Formatting
const markdownFormattingRule: DiagnosticRule = {
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

      // Headings without space after #
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

      // List items missing space
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

// Rule 20: Missing Code Block Language
const missingCodeBlockLanguageRule: DiagnosticRule = {
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

// Rule 21: Stale Docs
const staleDocsRule: DiagnosticRule = {
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

// Rule 22: Missing Table of Contents
const missingTocRule: DiagnosticRule = {
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

        // Insert [TOC] before the first heading
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

// Rule 23: Deprecated Syntax
const deprecatedSyntaxRule: DiagnosticRule = {
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

      // HTML details/summary that could be markdown
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

      // Deprecated bold syntax using underscores
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

      // Deprecated italic syntax using underscores
      if (/(?<![_\w])_(?!_)(.+?)_(?![_\w])/.test(line) && !/```/.test(line) && !/\[.*\]\(.*\)/.test(line)) {
        // Only flag if it looks intentional
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

export const ALL_RULES: DiagnosticRule[] = [
  brokenLinkRule,
  missingFrontmatterRule,
  missingTitleRule,
  missingDescriptionRule,
  missingOwnerRule,
  missingTagsRule,
  duplicateTitleRule,
  invalidMarkdownRule,
  brokenMermaidRule,
  brokenImageRule,
  emptyPageRule,
  orphanPageRule,
  unlinkedPageRule,
  largePageRule,
  headingHierarchyRule,
  multipleH1Rule,
  duplicateBlankLinesRule,
  trailingWhitespaceRule,
  markdownFormattingRule,
  missingCodeBlockLanguageRule,
  staleDocsRule,
  missingTocRule,
  deprecatedSyntaxRule,
];

export function getRuleById(id: string): DiagnosticRule | undefined {
  return ALL_RULES.find((r) => r.id === id);
}

export function getRulesByCategory(category: DiagnosticCategory): DiagnosticRule[] {
  return ALL_RULES.filter((r) => r.category === category);
}

export function getAutoFixableRules(): DiagnosticRule[] {
  return ALL_RULES.filter((r) => r.canAutoFix);
}
