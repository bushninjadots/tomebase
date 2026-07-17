import { prisma } from '@fluid/database';
import { scanPages } from '@/lib/diagnostics/engine';
import { findBacklinks } from '@/lib/wiki';
import { extractHeadings, extractDescription } from '@/lib/content';
import type { DiagnosticPage, HealthScore } from '@fluid/types';

export interface AIContext {
  project: {
    name: string;
    description: string | null;
    totalPages: number;
    pageSlugs: string[];
  };
  page: {
    title: string;
    slug: string;
    content: string;
    description: string | null;
    wordCount: number;
    readingTimeMin: number;
    headings: string[];
    tags: string[];
    published: boolean;
    viewCount: number;
  };
  linkedPages: Array<{ title: string; slug: string; exists: boolean }>;
  backlinkedPages: Array<{ title: string; slug: string }>;
  siblingPages: Array<{ title: string; slug: string }>;
  diagnostics: {
    score: HealthScore;
    issues: Array<{
      severity: string;
      title: string;
      description: string;
      rule: string;
      category: string;
    }>;
    totalPages: number;
    totalIssues: number;
  };
  projectStructure: string;
}

function extractWikiLinks(content: string): string[] {
  const links: string[] = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const target = match[1]?.split('|')[0]?.trim();
    if (target) links.push(target);
  }
  return [...new Set(links)];
}

function extractInlineLinks(content: string): string[] {
  const links: string[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const target = match[2]?.trim();
    if (target && !target.startsWith('http') && !target.startsWith('#')) {
      links.push(target);
    }
  }
  return [...new Set(links)];
}

function extractFrontmatter(content: string): { raw: string; data: Record<string, string> } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return { raw: '', data: {} };

  const raw = match[1] || '';
  const data: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      data[key] = value;
    }
  }
  return { raw, data };
}

export async function buildAIContext(params: {
  projectId: string;
  pageId: string;
  content?: string;
}): Promise<AIContext> {
  const { projectId, pageId, content: providedContent } = params;

  const [project, currentPage, allProjectPages] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, description: true },
    }),
    prisma.docPage.findUnique({
      where: { id: pageId },
      select: {
        id: true, title: true, slug: true, content: true,
        description: true, published: true, viewCount: true,
        createdAt: true, updatedAt: true,
      },
    }),
    prisma.docPage.findMany({
      where: { projectId },
      select: {
        id: true, title: true, slug: true, content: true,
        description: true, published: true, viewCount: true,
        createdAt: true, updatedAt: true,
      },
      orderBy: { title: 'asc' },
    }),
  ]);

  const pageContent = providedContent || currentPage?.content || '';
  const pageWordCount = pageContent.trim() ? pageContent.trim().split(/\s+/).length : 0;
  const pageReadingTime = Math.max(1, Math.ceil(pageWordCount / 200));
  const headings = extractHeadings(pageContent).map((h) => h.text);
  const { data: frontmatter } = extractFrontmatter(pageContent);
  const tags = Object.keys(frontmatter).filter((k) =>
    ['tags', 'keywords', 'label', 'category'].includes(k.toLowerCase()),
  ).flatMap((k) => (frontmatter[k] || '').split(',').map((t) => t.trim()).filter(Boolean));

  // Find wiki links in the page
  const wikiLinkTargets = extractWikiLinks(pageContent);
  const inlineLinkTargets = extractInlineLinks(pageContent);
  const allLinkTargets = [...wikiLinkTargets, ...inlineLinkTargets];

  // Resolve links
  const linkedPages = allLinkTargets.map((target) => {
    const slugified = target.toLowerCase().replace(/\s+/g, '-');
    const found = allProjectPages.find(
      (p) => p.slug === slugified || p.title.toLowerCase() === target.toLowerCase(),
    );
    return {
      title: found?.title || target,
      slug: found?.slug || slugified,
      exists: !!found,
    };
  });

  // Find backlinks
  const backlinkedPages = findBacklinks(pageId, allProjectPages.map((p) => ({
    id: p.id, title: p.title, slug: p.slug, content: p.content, projectId,
  }))).map((p) => ({ title: p.title, slug: p.slug }));

  // Sibling pages (same project, not current)
  const siblingPages = allProjectPages
    .filter((p) => p.id !== pageId)
    .map((p) => ({ title: p.title, slug: p.slug }));

  // Run diagnostics
  const diagnosticPages: DiagnosticPage[] = allProjectPages.map((p) => ({
    id: p.id, title: p.title, slug: p.slug, content: p.content,
    description: p.description, published: p.published,
    viewCount: p.viewCount, lastViewedAt: null,
    createdAt: p.createdAt, updatedAt: p.updatedAt,
  }));
  const scanResult = scanPages(diagnosticPages);
  const pageIssues = scanResult.diagnostics
    .filter((d) => d.pageId === pageId)
    .map((d) => ({
      severity: d.severity,
      title: d.title,
      description: d.description,
      rule: d.rule,
      category: d.category,
    }));

  // Build project structure summary
  const projectStructure = allProjectPages
    .slice(0, 30)
    .map((p) => `- ${p.title} (/docs/${p.slug})`)
    .join('\n');

  return {
    project: {
      name: project?.name || 'Unknown Project',
      description: project?.description ?? null,
      totalPages: allProjectPages.length,
      pageSlugs: allProjectPages.map((p) => p.slug),
    },
    page: {
      title: currentPage?.title || 'Untitled',
      slug: currentPage?.slug || '',
      content: pageContent,
      description: currentPage?.description || extractDescription(pageContent),
      wordCount: pageWordCount,
      readingTimeMin: pageReadingTime,
      headings,
      tags,
      published: currentPage?.published || false,
      viewCount: currentPage?.viewCount || 0,
    },
    linkedPages,
    backlinkedPages,
    siblingPages,
    diagnostics: {
      score: scanResult.healthScore,
      issues: pageIssues.slice(0, 15),
      totalPages: allProjectPages.length,
      totalIssues: scanResult.diagnostics.length,
    },
    projectStructure,
  };
}

export function contextToString(ctx: AIContext): string {
  const parts: string[] = [];

  parts.push(`PROJECT: ${ctx.project.name}`);
  if (ctx.project.description) parts.push(`Description: ${ctx.project.description}`);
  parts.push(`Total pages: ${ctx.project.totalPages}`);

  parts.push(`\nCURRENT PAGE: ${ctx.page.title} (/docs/${ctx.page.slug})`);
  if (ctx.page.description) parts.push(`Description: ${ctx.page.description}`);
  parts.push(`Words: ${ctx.page.wordCount}, Reading time: ${ctx.page.readingTimeMin} min`);
  parts.push(`Published: ${ctx.page.published ? 'Yes' : 'No'}, Views: ${ctx.page.viewCount}`);
  if (ctx.page.headings.length > 0) parts.push(`Headings: ${ctx.page.headings.join(' > ')}`);
  if (ctx.page.tags.length > 0) parts.push(`Tags: ${ctx.page.tags.join(', ')}`);

  if (ctx.linkedPages.length > 0) {
    const broken = ctx.linkedPages.filter((l) => !l.exists);
    const valid = ctx.linkedPages.filter((l) => l.exists);
    if (valid.length > 0) parts.push(`\nLinked pages: ${valid.map((l) => l.title).join(', ')}`);
    if (broken.length > 0) parts.push(`Broken links: ${broken.map((l) => l.title).join(', ')}`);
  }

  if (ctx.backlinkedPages.length > 0) {
    parts.push(`Pages linking here: ${ctx.backlinkedPages.map((l) => l.title).join(', ')}`);
  }

  if (ctx.diagnostics.issues.length > 0) {
    parts.push(`\nDIAGNOSTICS (score: ${ctx.diagnostics.score}/100, ${ctx.diagnostics.totalIssues} total issues):`);
    for (const issue of ctx.diagnostics.issues) {
      parts.push(`- [${issue.severity}] ${issue.title}: ${issue.description}`);
    }
  } else {
    parts.push(`\nDIAGNOSTICS: No issues (score: ${ctx.diagnostics.score}/100)`);
  }

  if (ctx.siblingPages.length > 0) {
    parts.push(`\nOTHER PAGES IN PROJECT (${ctx.siblingPages.length}):`);
    for (const sp of ctx.siblingPages.slice(0, 15)) {
      parts.push(`- ${sp.title}`);
    }
  }

  return parts.join('\n');
}
