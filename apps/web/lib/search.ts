// Canonical search utility — single implementation used by all search API routes.
// Eliminates three independent ranking algorithms that previously existed across
// lib/search-index.ts, api/search/route.ts, and api/public/search/route.ts.

import { prisma, type Prisma } from '@fluid/database';

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  projectId: string;
  projectName?: string;
  score: number;
  matchType: 'title_exact' | 'title_starts_with' | 'title_includes' | 'content_match' | 'symbol_match';
  snippet: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  includeSymbols?: boolean;
  projectId?: string;
  publishedOnly?: boolean;
}

function getSnippet(content: string, query: string, maxLength = 200): string {
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return content.slice(0, maxLength);

  const start = Math.max(0, idx - 60);
  const end = Math.min(content.length, idx + query.length + 80);
  let snippet = content.slice(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

function scorePage(
  title: string,
  content: string,
  query: string,
): { score: number; matchType: SearchResult['matchType'] } {
  const lowerTitle = title.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerTitle === lowerQuery) return { score: 100, matchType: 'title_exact' };
  if (lowerTitle.startsWith(lowerQuery)) return { score: 80, matchType: 'title_starts_with' };
  if (lowerTitle.includes(lowerQuery)) return { score: 60, matchType: 'title_includes' };
  if (content.toLowerCase().includes(lowerQuery)) return { score: 10, matchType: 'content_match' };
  return { score: 0, matchType: 'content_match' };
}

export async function searchPages(
  query: string,
  options: SearchOptions & { projectIds?: string[] },
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const {
    limit = 20, offset = 0, includeSymbols = true,
    projectIds, projectId, publishedOnly = false,
  } = options;
  const filterProjectIds = projectId ? [projectId] : projectIds;

  const where: Prisma.DocPageWhereInput = {
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
    ],
  };
  if (filterProjectIds) {
    where.projectId = { in: filterProjectIds as string[] };
  }
  if (publishedOnly) {
    where.published = true;
  }

  const pages = await prisma.docPage.findMany({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      projectId: true,
    },
    orderBy: [{ title: 'asc' }],
    take: limit,
    skip: offset,
  });

  // Resolve project names
  const projectIdSet = new Set(pages.map((p) => p.projectId));
  const projectMap = new Map<string, string>();
  if (projectIdSet.size > 0) {
    const projects = await prisma.project.findMany({
      where: { id: { in: [...projectIdSet] } },
      select: { id: true, name: true },
    });
    for (const p of projects) projectMap.set(p.id, p.name);
  }

  const results: SearchResult[] = pages.map((page) => {
    const { score, matchType } = scorePage(page.title, page.content, query);
    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      projectId: page.projectId,
      projectName: projectMap.get(page.projectId),
      score,
      matchType,
      snippet: getSnippet(page.content, query),
    };
  });

  // Include repository index symbol matches if requested
  if (includeSymbols) {
    try {
      const symbolWhere: Prisma.RepositoryIndexEntryWhereInput = {};
      if (filterProjectIds) {
        symbolWhere.projectId = { in: filterProjectIds as string[] };
      }
      symbolWhere.OR = [
        { symbolName: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ];

      const symbols = await prisma.repositoryIndexEntry.findMany({
        where: symbolWhere,
        select: {
          id: true,
          symbolName: true,
          symbolType: true,
          content: true,
          pageId: true,
          projectId: true,
          page: { select: { title: true, slug: true } },
        },
        take: limit,
      });

      for (const sym of symbols) {
        const lowerSym = sym.symbolName.toLowerCase();
        const lowerQuery = query.toLowerCase();
        let score = 0;
        let matchType: SearchResult['matchType'] = 'symbol_match';

        if (lowerSym === lowerQuery) score = 90;
        else if (lowerSym.startsWith(lowerQuery)) score = 70;
        else if (lowerSym.includes(lowerQuery)) score = 50;
        else score = 30;

        results.push({
          id: sym.id,
          title: sym.symbolName,
          slug: sym.page?.slug || '',
          projectId: sym.projectId,
          projectName: projectMap.get(sym.projectId),
          score,
          matchType,
          snippet: getSnippet(sym.content, query),
        });
      }
    } catch {
      // Repository index may not exist
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
