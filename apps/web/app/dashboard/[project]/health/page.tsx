import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Unlink, FileText, Search, CheckCircle } from 'lucide-react';
import { extractWikiLinks } from '@/lib/wiki';

interface PageProps {
  params: Promise<{ project: string }>;
}

export default async function ProjectHealthPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { project: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { _count: { select: { pages: true } } },
  });

  if (!project || project.userId !== session.user.id) notFound();

  const pages = await prisma.docPage.findMany({
    where: { projectId },
    select: { id: true, title: true, slug: true, content: true, published: true, createdAt: true },
    orderBy: { title: 'asc' },
  });

  const pageTitles = new Set(pages.map((p) => p.title.toLowerCase()));
  const linkCounts = new Map<string, number>();
  for (const p of pages) linkCounts.set(p.title.toLowerCase(), 0);

  const brokenLinks: { sourceTitle: string; sourceId: string; linkText: string }[] = [];

  for (const page of pages) {
    const links = extractWikiLinks(page.content);
    for (const link of links) {
      const normalized = link.toLowerCase();
      const existing = linkCounts.get(normalized);
      if (existing !== undefined) {
        linkCounts.set(normalized, existing + 1);
      }
      if (!pageTitles.has(normalized)) {
        brokenLinks.push({ sourceTitle: page.title, sourceId: page.id, linkText: link });
      }
    }
  }

  const orphans = pages
    .filter((p) => (linkCounts.get(p.title.toLowerCase()) ?? 0) === 0)
    .map(({ id, title, slug, published, createdAt }) => ({ id, title, slug, published, createdAt }));

  const emptyPages = pages
    .filter((p) => !p.content || p.content.trim().length === 0)
    .map(({ id, title, slug, published, createdAt }) => ({ id, title, slug, published, createdAt }));

  const hasIssues = brokenLinks.length > 0 || orphans.length > 0 || emptyPages.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        <Link
          href={`/docs/${project.id}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {project.name}
        </Link>

        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Doc Health</h1>
            {!hasIssues && (
              <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-0.5 text-xs font-medium text-green-700">
                <CheckCircle className="h-3 w-3" />
                All Clear
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Scanned {pages.length} page{pages.length === 1 ? '' : 's'} for broken links, orphaned pages, and empty content.
          </p>

          {brokenLinks.length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Broken Wiki Links
                <span className="ml-auto text-sm font-normal text-gray-400">{brokenLinks.length}</span>
              </h2>
              <p className="mt-1 text-sm text-gray-500 mb-3">
                These links reference pages that don&apos;t exist yet.
              </p>
              <div className="space-y-2">
                {brokenLinks.map((bl, i) => (
                  <div key={i} className="rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3 text-sm">
                    <span className="font-medium text-gray-900">{bl.linkText}</span>
                    <span className="text-gray-400 mx-1.5">in</span>
                    <Link href={`/docs/${project.id}/${bl.sourceId}`} className="text-fluid-600 hover:text-fluid-700 underline underline-offset-2">
                      {bl.sourceTitle}
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {orphans.length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Unlink className="h-4 w-4 text-blue-500" />
                Orphan Pages
                <span className="ml-auto text-sm font-normal text-gray-400">{orphans.length}</span>
              </h2>
              <p className="mt-1 text-sm text-gray-500 mb-3">
                No other pages link to these — consider adding links or removing them.
              </p>
              <div className="space-y-2">
                {orphans.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{o.title}</span>
                      {!o.published && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">draft</span>
                      )}
                    </div>
                    <Link
                      href={`/docs/${project.id}/${o.slug}`}
                      className="text-fluid-600 hover:text-fluid-700 text-xs font-medium"
                    >
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {emptyPages.length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FileText className="h-4 w-4 text-gray-400" />
                Empty Pages
                <span className="ml-auto text-sm font-normal text-gray-400">{emptyPages.length}</span>
              </h2>
              <p className="mt-1 text-sm text-gray-500 mb-3">
                These pages have no content yet.
              </p>
              <div className="space-y-2">
                {emptyPages.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{e.title}</span>
                      {!e.published && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">draft</span>
                      )}
                    </div>
                    <Link href={`/docs/${project.id}/${e.slug}`} className="text-fluid-600 hover:text-fluid-700 text-xs font-medium">
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!hasIssues && (
            <div className="mt-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">No issues found</h2>
              <p className="mt-1 text-sm text-gray-500">
                All pages have content, all wiki links resolve, and nothing is orphaned.
              </p>
            </div>
          )}

          <div className="mt-8 rounded-lg border border-gray-100 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Search className="h-3 w-3" />
              Wiki links are resolved case-insensitively by page title.
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
