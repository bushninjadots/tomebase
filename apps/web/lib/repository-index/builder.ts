import { prisma } from '@fluid/database';
import type { DiagnosticPage } from '@fluid/types';
import type { Prisma } from '@prisma/client';

interface Section {
  heading: string;
  level: number;
  content: string;
}

function extractSections(content: string): Section[] {
  const sections: Section[] = [];
  const lines = content.split('\n');
  let currentHeading = '';
  let currentLevel = 0;
  let currentContent: string[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      if (currentHeading) {
        sections.push({
          heading: currentHeading,
          level: currentLevel,
          content: currentContent.join('\n').trim(),
        });
      }
      currentHeading = match[2]!.trim();
      currentLevel = match[1]!.length;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentHeading) {
    sections.push({
      heading: currentHeading,
      level: currentLevel,
      content: currentContent.join('\n').trim(),
    });
  }

  return sections;
}

function extractCodeBlocks(content: string): Array<{ code: string; language: string; line: number }> {
  const blocks: Array<{ code: string; language: string; line: number }> = [];
  const lines = content.split('\n');
  let inBlock = false;
  let currentCode: string[] = [];
  let currentLang = '';
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const fenceMatch = lines[i]!.match(/^```(\w*)/);
    if (fenceMatch) {
      if (!inBlock) {
        inBlock = true;
        currentLang = fenceMatch[1] || 'text';
        currentCode = [];
        startLine = i + 1;
      } else {
        blocks.push({
          code: currentCode.join('\n'),
          language: currentLang,
          line: startLine,
        });
        inBlock = false;
      }
    } else if (inBlock) {
      currentCode.push(lines[i]!);
    }
  }

  return blocks;
}

function extractMermaidDiagrams(content: string): Array<{ diagram: string; line: number }> {
  const diagrams: Array<{ diagram: string; line: number }> = [];
  const regex = /```mermaid\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    diagrams.push({ diagram: match[1]!.trim(), line });
  }
  return diagrams;
}

function extractTables(content: string): Array<{ table: string; line: number; heading: string }> {
  const tables: Array<{ table: string; line: number; heading: string }> = [];
  const lines = content.split('\n');
  let inTable = false;
  let currentTable: string[] = [];
  let startLine = 0;
  const headingRegex = /^#{1,6}\s+(.+)$/;
  let lastHeading = '';

  for (let i = 0; i < lines.length; i++) {
    const headingMatch = lines[i]!.match(headingRegex);
    if (headingMatch) {
      lastHeading = headingMatch[1]!.trim();
    }

    const isTableRow = lines[i]!.startsWith('|') && lines[i]!.endsWith('|');
    if (isTableRow) {
      if (!inTable) {
        inTable = true;
        startLine = i + 1;
        currentTable = [];
      }
      currentTable.push(lines[i]!);
    } else if (inTable) {
      tables.push({ table: currentTable.join('\n'), line: startLine, heading: lastHeading });
      inTable = false;
    }
  }

  if (inTable) {
    tables.push({ table: currentTable.join('\n'), line: startLine, heading: lastHeading });
  }

  return tables;
}

function extractSymbolsFromCode(code: string, language: string): Array<{ name: string; type: string }> {
  const symbols: Array<{ name: string; type: string }> = [];

  if (language === 'typescript' || language === 'javascript' || language === 'ts' || language === 'js') {
    const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
    let match;
    while ((match = funcRegex.exec(code)) !== null) {
      symbols.push({ name: match[1]!, type: 'function' });
    }

    const classRegex = /(?:export\s+)?class\s+(\w+)/g;
    while ((match = classRegex.exec(code)) !== null) {
      symbols.push({ name: match[1]!, type: 'class' });
    }

    const interfaceRegex = /(?:export\s+)?interface\s+(\w+)/g;
    while ((match = interfaceRegex.exec(code)) !== null) {
      symbols.push({ name: match[1]!, type: 'interface' });
    }

    const typeRegex = /(?:export\s+)?type\s+(\w+)/g;
    while ((match = typeRegex.exec(code)) !== null) {
      symbols.push({ name: match[1]!, type: 'type' });
    }
  }

  if (language === 'python' || language === 'py') {
    const funcRegex = /(?:async\s+)?def\s+(\w+)/g;
    let match;
    while ((match = funcRegex.exec(code)) !== null) {
      symbols.push({ name: match[1]!, type: 'function' });
    }
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(code)) !== null) {
      symbols.push({ name: match[1]!, type: 'class' });
    }
  }

  if (language === 'go') {
    const funcRegex = /func\s+(\w+)/g;
    let match;
    while ((match = funcRegex.exec(code)) !== null) {
      symbols.push({ name: match[1]!, type: 'function' });
    }
    const structRegex = /type\s+(\w+)\s+struct/g;
    while ((match = structRegex.exec(code)) !== null) {
      symbols.push({ name: match[1]!, type: 'class' });
    }
    const ifaceRegex = /type\s+(\w+)\s+interface/g;
    while ((match = ifaceRegex.exec(code)) !== null) {
      symbols.push({ name: match[1]!, type: 'interface' });
    }
  }

  if (language === 'rust' || language === 'rs') {
    const funcRegex = /(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/g;
    let match;
    while ((match = funcRegex.exec(code)) !== null) {
      symbols.push({ name: match[1]!, type: 'function' });
    }
    const structRegex = /(?:pub\s+)?struct\s+(\w+)/g;
    while ((match = structRegex.exec(code)) !== null) {
      symbols.push({ name: match[1]!, type: 'class' });
    }
    const traitRegex = /(?:pub\s+)?trait\s+(\w+)/g;
    while ((match = traitRegex.exec(code)) !== null) {
      symbols.push({ name: match[1]!, type: 'interface' });
    }
  }

  return symbols;
}

function extractFrontmatterFields(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fields: Record<string, unknown> = {};
  for (const line of match[1]!.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value: unknown = line.slice(colonIdx + 1).trim();
      if (value === '[]' || value === '') value = [];
      else if (typeof value === 'string' && !isNaN(Number(value))) value = Number(value);
      fields[key] = value;
    }
  }
  return fields;
}

function extractPageRelationships(
  content: string,
  pageId: string,
  allPages: DiagnosticPage[],
): Array<{ targetSymbol: string; targetKind: string; type: string }> {
  const relationships: Array<{ targetSymbol: string; targetKind: string; type: string }> = [];

  const wikiLinkRegex = /\[\[([^\]|]+?)(?:\|[^\]]+)?\]\]/g;
  let match;
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    const target = match[1]!.trim();
    const found = allPages.find((p) => p.title.toLowerCase() === target.toLowerCase());
    relationships.push({
      targetSymbol: target,
      targetKind: 'page_definition',
      type: found ? 'wiki_link' : 'broken_wiki_link',
    });
  }

  return relationships;
}

export async function buildRepositoryIndex(
  projectId: string,
  pages: DiagnosticPage[],
): Promise<{
  entriesCreated: number;
  entriesUpdated: number;
  duration: number;
}> {
  const startTime = Date.now();
  let created = 0;
  let updated = 0;

  const entries: Array<{
    projectId: string;
    pageId: string | null;
    symbolName: string;
    symbolType: string;
    kind: string;
    content: string;
    filePath: string | null;
    language: string | null;
    metadata: Record<string, unknown>;
    relationships: Array<{ targetSymbol: string; targetKind: string; type: string }>;
  }> = [];

  for (const page of pages) {
    const frontmatter = extractFrontmatterFields(page.content);

    entries.push({
      projectId,
      pageId: page.id,
      symbolName: page.title,
      symbolType: 'page',
      kind: 'page_definition',
      content: page.content,
      filePath: page.slug ? `docs/${page.slug}.md` : null,
      language: 'markdown',
      metadata: {
        description: page.description,
        published: page.published,
        viewCount: page.viewCount,
        slug: page.slug,
        ...frontmatter,
      },
      relationships: extractPageRelationships(page.content, page.id, pages),
    });

    const sections = extractSections(page.content);
    for (const section of sections) {
      if (section.heading) {
        entries.push({
          projectId,
          pageId: page.id,
          symbolName: section.heading,
          symbolType: 'heading',
          kind: 'heading',
          content: section.content,
          filePath: `docs/${page.slug}.md#${section.heading.toLowerCase().replace(/\s+/g, '-')}`,
          language: 'markdown',
          metadata: { level: section.level, heading: section.heading },
          relationships: [],
        });
      }
    }

    const codeBlocks = extractCodeBlocks(page.content);
    for (const block of codeBlocks) {
      const symbols = extractSymbolsFromCode(block.code, block.language);
      for (const symbol of symbols) {
        entries.push({
          projectId,
          pageId: page.id,
          symbolName: symbol.name,
          symbolType: symbol.type,
          kind: 'code_symbol',
          content: block.code,
          filePath: `docs/${page.slug}.md`,
          language: block.language,
          metadata: { line: block.line, parent: page.title },
          relationships: [],
        });
      }

      entries.push({
        projectId,
        pageId: page.id,
        symbolName: `Code block (${block.language})`,
        symbolType: 'code_block',
        kind: 'import',
        content: block.code,
        filePath: `docs/${page.slug}.md`,
        language: block.language,
        metadata: { line: block.line, symbols: symbols.map((s) => s.name) },
        relationships: [],
      });
    }

    const diagrams = extractMermaidDiagrams(page.content);
    for (const diagram of diagrams) {
      entries.push({
        projectId,
        pageId: page.id,
        symbolName: `Mermaid diagram (line ${diagram.line})`,
        symbolType: 'mermaid_diagram',
        kind: 'import',
        content: diagram.diagram,
        filePath: `docs/${page.slug}.md`,
        language: 'mermaid',
        metadata: { line: diagram.line, parent: page.title },
        relationships: [],
      });
    }

    const tables = extractTables(page.content);
    for (const table of tables) {
      entries.push({
        projectId,
        pageId: page.id,
        symbolName: `Table${table.heading ? `: ${table.heading}` : ''}`,
        symbolType: 'table',
        kind: 'import',
        content: table.table,
        filePath: `docs/${page.slug}.md`,
        language: 'markdown',
        metadata: { line: table.line, heading: table.heading, parent: page.title },
        relationships: [],
      });
    }
  }

  for (const entry of entries) {
    const existing = await prisma.repositoryIndexEntry.findFirst({
      where: {
        projectId: entry.projectId,
        symbolName: entry.symbolName,
        kind: entry.kind,
        pageId: entry.pageId ?? undefined,
      },
    });

    if (existing) {
      await prisma.repositoryIndexEntry.update({
        where: { id: existing.id },
        data: {
          symbolType: entry.symbolType,
          content: entry.content,
          filePath: entry.filePath,
          language: entry.language,
          metadata: entry.metadata as Prisma.InputJsonValue,
          relationships: entry.relationships as Prisma.InputJsonValue,
        },
      });
      updated++;
    } else {
      await prisma.repositoryIndexEntry.create({
        data: {
          projectId: entry.projectId,
          pageId: entry.pageId,
          symbolName: entry.symbolName,
          symbolType: entry.symbolType,
          kind: entry.kind,
          content: entry.content,
          filePath: entry.filePath,
          language: entry.language,
          metadata: entry.metadata as Prisma.InputJsonValue,
          relationships: entry.relationships as Prisma.InputJsonValue,
        },
      });
      created++;
    }
  }

  return {
    entriesCreated: created,
    entriesUpdated: updated,
    duration: Date.now() - startTime,
  };
}

export async function buildIndexForProject(projectId: string): Promise<{
  entriesCreated: number;
  entriesUpdated: number;
  duration: number;
}> {
  const pages = await prisma.docPage.findMany({
    where: { projectId },
    select: {
      id: true, title: true, slug: true, content: true,
      description: true, published: true, viewCount: true,
      lastViewedAt: true, createdAt: true, updatedAt: true,
    },
  });

  const diagnosticPages: DiagnosticPage[] = pages.map((p) => ({
    id: p.id, title: p.title, slug: p.slug, content: p.content,
    description: p.description, published: p.published,
    viewCount: p.viewCount, lastViewedAt: p.lastViewedAt,
    createdAt: p.createdAt, updatedAt: p.updatedAt,
  }));

  return buildRepositoryIndex(projectId, diagnosticPages);
}
