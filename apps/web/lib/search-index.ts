import { prisma } from '@fluid/database';

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  projectId: string;
  projectName: string;
  content: string;
  score: number;
  matchType: 'title' | 'content' | 'symbol';
}

export async function searchProject(
  projectId: string,
  query: string,
  limit: number = 20,
): Promise<SearchResult[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const pages = await prisma.docPage.findMany({
    where: { projectId },
    select: {
      id: true, title: true, slug: true, content: true, projectId: true,
    },
    take: 200,
  });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });
  const projectName = project?.name || '';

  const results: SearchResult[] = [];

  for (const page of pages) {
    const titleLower = page.title.toLowerCase();
    let score = 0;
    let matchType: 'title' | 'content' | 'symbol' = 'content';

    if (titleLower === q) {
      score = 100;
      matchType = 'title';
    } else if (titleLower.startsWith(q)) {
      score = 80;
      matchType = 'title';
    } else if (titleLower.includes(q)) {
      score = 60;
      matchType = 'title';
    } else if (page.content.toLowerCase().includes(q)) {
      const idx = page.content.toLowerCase().indexOf(q);
      score = Math.max(10, 40 - Math.floor(idx / 100));
      matchType = 'content';
    }

    if (score > 0) {
      results.push({
        id: page.id,
        title: page.title,
        slug: page.slug,
        projectId: page.projectId,
        projectName,
        content: page.content.slice(0, 300),
        score,
        matchType,
      });
    }
  }

  try {
    const indexEntries = await prisma.repositoryIndexEntry.findMany({
      where: { projectId, kind: 'code_symbol' },
      take: 100,
    });

    for (const entry of indexEntries) {
      const nameLower = entry.symbolName.toLowerCase();
      if (nameLower.includes(q)) {
        results.push({
          id: `${entry.id}-symbol`,
          title: `${entry.symbolName} (${entry.symbolType})`,
          slug: entry.filePath?.replace('docs/', '').replace('.md', '') || '',
          projectId,
          projectName,
          content: entry.content.slice(0, 300),
          score: 50,
          matchType: 'symbol',
        });
      }
    }
  } catch {
    // Index may not exist yet
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function searchAllProjects(
  projectIds: string[],
  query: string,
  limit: number = 20,
): Promise<SearchResult[]> {
  const q = query.toLowerCase().trim();
  if (!q || projectIds.length === 0) return [];

  const pages = await prisma.docPage.findMany({
    where: { projectId: { in: projectIds } },
    select: {
      id: true, title: true, slug: true, content: true, projectId: true,
      project: { select: { name: true } },
    },
    take: 500,
  });

  const results: SearchResult[] = [];

  for (const page of pages) {
    const titleLower = page.title.toLowerCase();
    let score = 0;
    let matchType: 'title' | 'content' | 'symbol' = 'content';

    if (titleLower === q) {
      score = 100;
      matchType = 'title';
    } else if (titleLower.startsWith(q)) {
      score = 80;
      matchType = 'title';
    } else if (titleLower.includes(q)) {
      score = 60;
      matchType = 'title';
    } else if (page.content.toLowerCase().includes(q)) {
      const idx = page.content.toLowerCase().indexOf(q);
      score = Math.max(10, 40 - Math.floor(idx / 100));
      matchType = 'content';
    }

    if (score > 0) {
      results.push({
        id: page.id,
        title: page.title,
        slug: page.slug,
        projectId: page.projectId,
        projectName: page.project.name,
        content: page.content.slice(0, 300),
        score,
        matchType,
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function highlightMatches(text: string, query: string): string {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}
