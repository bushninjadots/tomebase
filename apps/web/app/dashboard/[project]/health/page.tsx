import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import Link from 'next/link';
import { 
  ArrowLeft, AlertTriangle, Unlink, FileText, Search, CheckCircle,
  Clock, Eye, TrendingDown, AlertCircle, Calendar
} from 'lucide-react';
import { extractWikiLinks } from '@/lib/wiki';
import { formatDistanceToNow } from 'date-fns';
import { LivingDocsSection } from '@/components/living-docs-section';

interface PageProps {
  params: Promise<{ project: string }>;
}

function calculateHealthScore(metrics: {
  totalPages: number;
  brokenLinks: number;
  orphans: number;
  emptyPages: number;
  stalePages: number;
  lowViewPages: number;
}) {
  const { totalPages, brokenLinks, orphans, emptyPages, stalePages, lowViewPages } = metrics;
  if (totalPages === 0) return 100;
  
  const issueWeight = (brokenLinks + orphans + emptyPages) / totalPages;
  const stalenessWeight = stalePages / totalPages;
  const engagementWeight = lowViewPages / totalPages;
  
  const score = Math.max(0, 100 - (issueWeight * 40 + stalenessWeight * 30 + engagementWeight * 30));
  return Math.round(score);
}

function getHealthColor(score: number) {
  if (score >= 80) return 'text-green-600 bg-green-50';
  if (score >= 60) return 'text-amber-600 bg-amber-50';
  if (score >= 40) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
}

function getHealthLabel(score: number) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Attention';
  return 'Critical';
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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const pages = await prisma.docPage.findMany({
    where: { projectId },
    select: { 
      id: true, 
      title: true, 
      slug: true, 
      content: true, 
      published: true, 
      createdAt: true,
      updatedAt: true,
      viewCount: true,
      lastViewedAt: true
    },
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

  const stalePages = pages
    .filter((p) => {
      const daysSinceUpdate = Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceUpdate > 30;
    })
    .map(({ id, title, slug, published, updatedAt, viewCount }) => ({
      id, title, slug, published, updatedAt, viewCount,
      daysSinceUpdate: Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

  const lowViewPages = pages
    .filter((p) => p.viewCount < 5 && p.published)
    .map(({ id, title, slug, published, viewCount, lastViewedAt }) => ({
      id, title, slug, published, viewCount, lastViewedAt
    }))
    .sort((a, b) => a.viewCount - b.viewCount);

  const neverViewedPages = pages
    .filter((p) => p.viewCount === 0 && p.published)
    .length;

  const healthScore = calculateHealthScore({
    totalPages: pages.length,
    brokenLinks: brokenLinks.length,
    orphans: orphans.length,
    emptyPages: emptyPages.length,
    stalePages: stalePages.length,
    lowViewPages: lowViewPages.length
  });

  const hasIssues = brokenLinks.length > 0 || orphans.length > 0 || emptyPages.length > 0 || stalePages.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href={`/docs/${project.id}`} className="hover:text-gray-700 transition-colors">{project.name}</Link>
          <span>/</span>
          <span className="text-gray-600">Health</span>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Documentation Health</h1>
            <span className={`flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-medium ${getHealthColor(healthScore)}`}>
              {healthScore >= 80 ? (
                <CheckCircle className="h-3 w-3" />
              ) : healthScore >= 60 ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {getHealthLabel(healthScore)} ({healthScore}%)
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Scanned {pages.length} page{pages.length === 1 ? '' : 's'} for quality, freshness, and engagement.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="rounded-lg border border-gray-100 bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FileText className="h-4 w-4" />
                Total Pages
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{pages.length}</div>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                Stale Pages
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-600">{stalePages.length}</div>
              <div className="text-xs text-gray-400">Not updated in 30+ days</div>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Eye className="h-4 w-4" />
                Low Engagement
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-600">{lowViewPages.length}</div>
              <div className="text-xs text-gray-400">Published with {'<'}5 views</div>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <TrendingDown className="h-4 w-4" />
                Never Viewed
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-400">{neverViewedPages}</div>
              <div className="text-xs text-gray-400">Published with 0 views</div>
            </div>
          </div>

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

          {stalePages.length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Clock className="h-4 w-4 text-amber-500" />
                Stale Pages
                <span className="ml-auto text-sm font-normal text-gray-400">{stalePages.length}</span>
              </h2>
              <p className="mt-1 text-sm text-gray-500 mb-3">
                These pages haven&apos;t been updated in over 30 days.
              </p>
              <div className="space-y-2">
                {stalePages.slice(0, 10).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{p.title}</span>
                      <span className="text-xs text-gray-400">
                        {p.daysSinceUpdate} days ago
                      </span>
                      <span className="text-xs text-gray-400">
                        {p.viewCount} views
                      </span>
                    </div>
                    <Link
                      href={`/docs/${project.id}/${p.slug}`}
                      className="text-fluid-600 hover:text-fluid-700 text-xs font-medium"
                    >
                      Update
                    </Link>
                  </div>
                ))}
                {stalePages.length > 10 && (
                  <div className="text-center text-sm text-gray-400 py-2">
                    + {stalePages.length - 10} more stale pages
                  </div>
                )}
              </div>
            </section>
          )}

          {lowViewPages.length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Eye className="h-4 w-4 text-blue-500" />
                Low Engagement Pages
                <span className="ml-auto text-sm font-normal text-gray-400">{lowViewPages.length}</span>
              </h2>
              <p className="mt-1 text-sm text-gray-500 mb-3">
                Published pages with very few views — consider promoting or removing them.
              </p>
              <div className="space-y-2">
                {lowViewPages.slice(0, 10).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{p.title}</span>
                      <span className="text-xs text-gray-400">
                        {p.viewCount} view{p.viewCount === 1 ? '' : 's'}
                      </span>
                      {p.lastViewedAt && (
                        <span className="text-xs text-gray-400">
                          Last viewed {formatDistanceToNow(new Date(p.lastViewedAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/docs/${project.id}/${p.slug}`}
                      className="text-fluid-600 hover:text-fluid-700 text-xs font-medium"
                    >
                      View
                    </Link>
                  </div>
                ))}
                {lowViewPages.length > 10 && (
                  <div className="text-center text-sm text-gray-400 py-2">
                    + {lowViewPages.length - 10} more low-engagement pages
                  </div>
                )}
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
              <h2 className="mt-4 text-lg font-semibold text-gray-900">Documentation is healthy!</h2>
              <p className="mt-1 text-sm text-gray-500">
                All pages have content, links resolve, and engagement is good.
              </p>
            </div>
          )}

          <div className="mt-8 rounded-lg border border-gray-100 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Search className="h-3 w-3" />
              Health score considers link quality, freshness, and engagement metrics.
            </div>
          </div>

          <LivingDocsSection projectId={project.id} />
        </div>
      </Container>
    </div>
  );
}