import { prisma } from '@fluid/database';
import type {
  RepositoryIndexEntry,
  RepositoryIndexQuery,
  RepositoryIndexQueryResult,
  RepositoryIndexSymbolType,
  RepositoryIndexKind,
} from '@fluid/types';

export async function queryIndex(query: RepositoryIndexQuery): Promise<RepositoryIndexQueryResult> {
  const startTime = Date.now();

  const where: Record<string, unknown> = { projectId: query.projectId };

  if (query.symbolType && query.symbolType !== 'all') {
    where.symbolType = query.symbolType;
  }

  if (query.kind && query.kind !== 'all') {
    where.kind = query.kind;
  }

  if (query.pageId) {
    where.pageId = query.pageId;
  }

  const [entries, totalCount] = await Promise.all([
    prisma.repositoryIndexEntry.findMany({
      where,
      take: query.limit || 50,
      orderBy: { updatedAt: 'desc' },
    }) as Promise<RepositoryIndexEntry[]>,
    prisma.repositoryIndexEntry.count({ where }),
  ]);

  let filtered = entries;
  if (query.query) {
    const q = query.query.toLowerCase();
    filtered = entries.filter(
      (e) =>
        e.symbolName.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q),
    );
  }

  return {
    entries: filtered.slice(0, query.limit || 50),
    totalCount: filtered.length,
    queryTime: Date.now() - startTime,
  };
}

export async function findRelatedEntries(
  projectId: string,
  pageId: string,
  limit: number = 10,
): Promise<RepositoryIndexEntry[]> {
  const pageEntry = await prisma.repositoryIndexEntry.findFirst({
    where: {
      projectId,
      pageId,
      kind: 'page_definition',
    },
  }) as RepositoryIndexEntry | null;

  if (!pageEntry) return [];

  const relatedNames: string[] = [];
  for (const rel of (pageEntry.relationships as Array<{ targetSymbol: string; targetKind: string; type: string }>) || []) {
    if (rel.type === 'wiki_link') {
      relatedNames.push(rel.targetSymbol);
    }
  }

  if (relatedNames.length === 0) return [];

  const related = await prisma.repositoryIndexEntry.findMany({
    where: {
      projectId,
      symbolName: { in: relatedNames },
      kind: 'page_definition',
    },
    take: limit,
  }) as RepositoryIndexEntry[];

  return related;
}

export async function findSymbols(
  projectId: string,
  query: string,
  limit: number = 10,
): Promise<RepositoryIndexEntry[]> {
  const q = query.toLowerCase();
  const entries = await prisma.repositoryIndexEntry.findMany({
    where: {
      projectId,
      kind: 'code_symbol',
    },
    take: 100,
  }) as RepositoryIndexEntry[];

  return entries
    .filter((e) => e.symbolName.toLowerCase().includes(q))
    .slice(0, limit);
}

export async function getProjectStructure(
  projectId: string,
): Promise<string> {
  const pages = await prisma.docPage.findMany({
    where: { projectId },
    select: { id: true, title: true, slug: true, parentId: true, order: true },
    orderBy: [{ order: 'asc' }, { title: 'asc' }],
  });

  if (pages.length === 0) return 'No pages yet.';

  const pageMap = new Map<string, typeof pages[0]>();
  for (const p of pages) pageMap.set(p.id, p);

  const childrenOf = new Map<string | null, typeof pages>();
  for (const p of pages) {
    const parent = p.parentId || null;
    const existing = childrenOf.get(parent) || [];
    existing.push(p);
    childrenOf.set(parent, existing);
  }

  function renderTree(parentId: string | null, depth: number): string {
    const kids = childrenOf.get(parentId) || [];
    let result = '';
    for (const kid of kids) {
      result += '  '.repeat(depth) + `- ${kid.title} (/docs/${kid.slug})\n`;
      result += renderTree(kid.id, depth + 1);
    }
    return result;
  }

  return renderTree(null, 0);
}

export async function getContextForQuery(
  projectId: string,
  pageId: string,
  userQuery: string,
): Promise<string> {
  const [related, pageEntry, symbols] = await Promise.all([
    findRelatedEntries(projectId, pageId, 5),
    prisma.repositoryIndexEntry.findFirst({
      where: { projectId, pageId, kind: 'page_definition' },
    }) as Promise<RepositoryIndexEntry | null>,
    userQuery ? findSymbols(projectId, userQuery, 5) : Promise.resolve([]),
  ]);

  const parts: string[] = [];

  if (pageEntry) {
    parts.push(`Current page: ${pageEntry.symbolName}`);
  }

  if (related.length > 0) {
    parts.push('Related pages:');
    for (const r of related) {
      parts.push(`  - ${r.symbolName} (${r.metadata?.description || 'no description'})`);
    }
  }

  if (symbols.length > 0) {
    parts.push('Matching code symbols:');
    for (const s of symbols) {
      parts.push(`  - ${s.symbolName} (${s.symbolType}) in ${s.metadata?.parent || 'unknown page'}`);
    }
  }

  return parts.join('\n');
}
