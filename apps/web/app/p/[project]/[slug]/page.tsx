import { prisma } from '@fluid/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Hash, ChevronRight, Clock, Eye, ExternalLink } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { ViewTracker } from '@/components/view-tracker';
import { extractTags } from '@/lib/wiki';
import { extractHeadings } from '@/lib/content';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ project: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { project: projectId, slug } = await params;
  const page = await prisma.docPage.findFirst({
    where: { projectId, slug, published: true },
    select: { title: true, description: true },
  });
  if (!page) return { title: 'Not Found' };
  const baseUrl = process.env.APP_URL || 'https://tomebase.io';
  return {
    title: page.title,
    description: page.description || undefined,
    openGraph: { title: page.title, description: page.description || undefined },
    alternates: { canonical: `${baseUrl}/p/${projectId}/${slug}` },
  };
}

export default async function PublicDocPage({ params }: PageProps) {
  const { project: projectId, slug } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, published: true },
  });

  if (!project || !project.published) notFound();

  const page = await prisma.docPage.findFirst({
    where: { projectId, slug, published: true },
  });

  if (!page) notFound();

  const allPages = await prisma.docPage.findMany({
    where: { projectId, published: true },
    select: { title: true, slug: true, content: true },
  });

  const tags = extractTags(page.content);
  const headings = extractHeadings(page.content);

  const backlinks = allPages
    .filter((p) => {
      if (p.title === page.title) return false;
      const pattern = page.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\[\\[${pattern}(?:\\|[^\\]]+)?\\]\\]`, 'i').test(p.content);
    })
    .map((p) => ({ title: p.title, slug: p.slug }));

  const currentPageIdx = allPages.findIndex((p) => p.slug === slug);
  const prevPage = currentPageIdx > 0 ? allPages[currentPageIdx - 1] : null;
  const nextPage = currentPageIdx < allPages.length - 1 ? allPages[currentPageIdx + 1] : null;

  return (
    <div className="mx-auto max-w-[760px] px-6 py-10 sm:py-14">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-1.5 text-xs text-theme-muted/50">
        <Link
          href={`/p/${projectId}`}
          className="hover:text-theme-subtle transition-colors"
        >
          {project.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-theme-subtle">{page.title}</span>
      </nav>

      <div className="flex gap-10">
        {/* Main content */}
        <article className="min-w-0 flex-1">
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-theme-main leading-tight">
              {page.title}
            </h1>
            {page.description && (
              <p className="mt-3 text-base text-theme-subtle/70 leading-relaxed">
                {page.description}
              </p>
            )}
            <div className="mt-5 flex items-center gap-4 text-xs text-theme-muted/40">
              {tags.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-0.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium text-theme-muted/60"
                    >
                      <Hash className="h-2.5 w-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(page.updatedAt).toLocaleDateString()}
              </span>
              {page.viewCount > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {page.viewCount}
                </span>
              )}
            </div>
          </header>

          <div className="border-t border-white/[0.06] pt-8">
            <Markdown
              content={page.content}
              projectId={projectId}
              pages={allPages.map((p) => ({ title: p.title, slug: p.slug }))}
              basePath={`/p/${projectId}`}
            />
          </div>

          {/* Prev / Next navigation */}
          {(prevPage || nextPage) && (
            <div className="mt-16 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-8">
              {prevPage ? (
                <Link
                  href={`/p/${projectId}/${prevPage.slug}`}
                  className="group rounded-xl border border-white/[0.06] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.02]"
                >
                  <span className="text-[11px] font-medium uppercase tracking-wider text-theme-muted/40">
                    Previous
                  </span>
                  <p className="mt-1.5 text-sm font-medium text-theme-subtle group-hover:text-theme-main transition-colors truncate">
                    {prevPage.title}
                  </p>
                </Link>
              ) : (
                <div />
              )}
              {nextPage && (
                <Link
                  href={`/p/${projectId}/${nextPage.slug}`}
                  className="group rounded-xl border border-white/[0.06] p-4 text-right transition-all hover:border-white/[0.12] hover:bg-white/[0.02]"
                >
                  <span className="text-[11px] font-medium uppercase tracking-wider text-theme-muted/40">
                    Next
                  </span>
                  <p className="mt-1.5 text-sm font-medium text-theme-subtle group-hover:text-theme-main transition-colors truncate">
                    {nextPage.title}
                  </p>
                </Link>
              )}
            </div>
          )}

          {/* Backlinks */}
          {backlinks.length > 0 && (
            <div className="mt-12 border-t border-white/[0.06] pt-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-theme-muted/40 mb-4">
                Referenced by
              </h2>
              <div className="space-y-2">
                {backlinks.map((bl) => (
                  <Link
                    key={bl.slug}
                    href={`/p/${projectId}/${bl.slug}`}
                    className="group flex items-center gap-2 rounded-lg border border-white/[0.06] px-3.5 py-2.5 text-sm text-theme-subtle hover:border-white/[0.12] hover:bg-white/[0.02] hover:text-theme-main transition-all"
                  >
                    <ExternalLink className="h-3 w-3 text-theme-muted/30 group-hover:text-theme-accent transition-colors shrink-0" />
                    {bl.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Table of contents */}
        {headings.length > 1 && (
          <aside className="hidden xl:block w-52 shrink-0">
            <div className="sticky top-20">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted/40 mb-3">
                On this page
              </p>
              <nav className="space-y-0.5">
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className="block rounded-md px-2.5 py-1 text-[12px] text-theme-muted/50 hover:text-theme-subtle hover:bg-theme-hover transition-colors"
                    style={{ paddingLeft: `${10 + (h.level - 1) * 12}px` }}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>

      <ViewTracker pageId={page.id} />
    </div>
  );
}
