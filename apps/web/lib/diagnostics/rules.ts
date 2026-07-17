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

// Rule 24: Missing Blank Line Before Heading
const missingBlankLineBeforeHeadingRule: DiagnosticRule = {
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

// Rule 25: Missing Blank Line After Heading
const missingBlankLineAfterHeadingRule: DiagnosticRule = {
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

// Rule 26: Inconsistent List Markers
const inconsistentListMarkersRule: DiagnosticRule = {
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

// Rule 27: Multiple Spaces
const multipleSpacesRule: DiagnosticRule = {
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

// Rule 28: Missing Newline at End of File
const missingNewlineEofRule: DiagnosticRule = {
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

// Rule 29: Missing Alt Text
const missingAltTextRule: DiagnosticRule = {
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

// Rule 30: Inconsistent Emphasis Style
const inconsistentEmphasisRule: DiagnosticRule = {
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

// Rule 31: Space Before Punctuation
const spaceBeforePunctuationRule: DiagnosticRule = {
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

// Rule 32: Double Punctuation
const doublePunctuationRule: DiagnosticRule = {
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

// Rule 33: HTML Entities
const htmlEntitiesRule: DiagnosticRule = {
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

// Rule 34: Missing Space After Punctuation
const missingSpaceAfterPunctuationRule: DiagnosticRule = {
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

// Rule 35: Trailing Punctuation in Heading
const trailingPunctuationInHeadingRule: DiagnosticRule = {
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

// Rule 36: Blank Line in Blockquote
const blankLineInBlockquoteRule: DiagnosticRule = {
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

    // Check for blank lines within blockquotes
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

// Rule 37: Missing Closing Backtick
const missingClosingBacktickRule: DiagnosticRule = {
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

      // Count backticks not part of code fences
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

// Rule 38: Unspaced Blockquote
const unspacedBlockquoteRule: DiagnosticRule = {
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

// Rule 39: Repeated Words
const repeatedWordsRule: DiagnosticRule = {
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
          // Skip common intentional duplicates like "had had", "that that"
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

// Rule 40: Missing Space Around Inline Code
const missingSpaceAroundInlineCodeRule: DiagnosticRule = {
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

      // Check for word immediately touching backtick
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

// Rule 41: Heading Ends With Colon
const headingEndsWithColonRule: DiagnosticRule = {
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

// Rule 42: Inconsistent Link Style
const inconsistentLinkStyleRule: DiagnosticRule = {
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
      // Convert wiki links to markdown style where possible
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

// Rule 43: Indented Code Block Without Language
const indentedCodeBlockRule: DiagnosticRule = {
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

// Rule 44: Hardcoded URLs
const hardcodedUrlRule: DiagnosticRule = {
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

      // Look for markdown links with relative paths
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

// Rule 45: Horizontal Rule Formatting
const horizontalRuleRule: DiagnosticRule = {
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

// Rule 46: Unnecessary Link Text
const unnecessaryLinkTextRule: DiagnosticRule = {
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

// Rule 47: Missing Link Text
const missingLinkTextRule: DiagnosticRule = {
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

// Rule 48: Long Line Length
const longLineLengthRule: DiagnosticRule = {
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

// Rule 49: Empty Link Target
const emptyLinkTargetRule: DiagnosticRule = {
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

// Rule 50: Frontmatter Over-Usage
const frontmatterOverUsageRule: DiagnosticRule = {
  id: 'frontmatter-over-usage',
  category: 'missing_frontmatter',
  title: 'Excessive Frontmatter Fields',
  description: 'The frontmatter has too many fields, reducing readability.',
  severity: 'info',
  canAutoFix: false,
  detect(page) {
    const content = page.content;
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return [];

    const fieldCount = frontmatterMatch[1]!.split('\n').filter((l) => l.includes(':')).length;
    if (fieldCount > 15) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          `Excessive frontmatter (${fieldCount} fields)`,
          `This page has ${fieldCount} frontmatter fields, which is more than recommended.`,
          'Too many frontmatter fields make pages harder to maintain. Consider moving metadata to a separate config file.',
          page,
          1,
        ),
      ];
    }
    return [];
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
  missingBlankLineBeforeHeadingRule,
  missingBlankLineAfterHeadingRule,
  inconsistentListMarkersRule,
  multipleSpacesRule,
  missingNewlineEofRule,
  missingAltTextRule,
  inconsistentEmphasisRule,
  spaceBeforePunctuationRule,
  doublePunctuationRule,
  htmlEntitiesRule,
  missingSpaceAfterPunctuationRule,
  trailingPunctuationInHeadingRule,
  blankLineInBlockquoteRule,
  missingClosingBacktickRule,
  unspacedBlockquoteRule,
  repeatedWordsRule,
  missingSpaceAroundInlineCodeRule,
  headingEndsWithColonRule,
  inconsistentLinkStyleRule,
  indentedCodeBlockRule,
  hardcodedUrlRule,
  horizontalRuleRule,
  unnecessaryLinkTextRule,
  missingLinkTextRule,
  longLineLengthRule,
  emptyLinkTargetRule,
  frontmatterOverUsageRule,
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
