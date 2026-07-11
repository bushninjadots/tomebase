import { prisma } from '@fluid/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, FileText, Eye, Clock, ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ project: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { project: projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { title: 'Not Found' };
  return {
    title: project.name,
    description: project.description || `Documentation for ${project.name}`,
    openGraph: { title: project.name, description: project.description || undefined },
  };
}

export default async function PublicProjectPage({ params }: PageProps) {
  const { project: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      pages: {
        where: { published: true },
        orderBy: { order: 'asc' },
        select: { id: true, title: true, slug: true, description: true, updatedAt: true, viewCount: true },
      },
    },
  });

  if (!project || !project.published) notFound();

  const totalViews = project.pages.reduce((sum, p) => sum + p.viewCount, 0);
  const totalPages = project.pages.length;

  return (
    <div className="min-h-[calc(100vh-48px)]">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-theme-border">
        <div className="absolute inset-0 bg-gradient-to-br from-theme-accent/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-theme-main">
                {project.name}
              </h1>
              {project.description && (
                <p className="mt-3 text-base sm:text-lg text-theme-subtle/80 max-w-xl leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>
            {project.customDomain && (
              <span className="shrink-0 rounded-full border border-theme-border bg-theme-hover px-3 py-1 text-xs font-medium text-theme-muted">
                {project.customDomain}
              </span>
            )}
          </div>

          {totalPages > 0 && (
            <div className="mt-8 flex items-center gap-5 text-xs text-theme-muted/60">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {totalPages} page{totalPages !== 1 ? 's' : ''}
              </span>
              {totalViews > 0 && (
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  {totalViews.toLocaleString()} view{totalViews !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-10">
        {totalPages === 0 ? (
          <div className="rounded-2xl border border-dashed border-theme-border p-16 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-theme-muted/30" />
            <h2 className="mt-4 text-base font-semibold text-theme-main">No published pages yet</h2>
            <p className="mt-1.5 text-sm text-theme-muted/60">
              Check back later for documentation.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted/40 mb-4">
              All pages
            </p>
            {project.pages.map((page) => (
              <Link
                key={page.id}
                href={`/p/${projectId}/${page.slug}`}
                className="group flex items-start gap-4 rounded-xl border border-theme-border bg-theme-card p-5 transition-all hover:border-theme-accent/30 hover:bg-theme-hover"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-theme-accent/10 text-theme-accent mt-0.5">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-semibold text-theme-main group-hover:text-theme-accent transition-colors">
                    {page.title}
                  </h2>
                  {page.description && (
                    <p className="mt-1 text-sm text-theme-muted/60 line-clamp-2 leading-relaxed">
                      {page.description}
                    </p>
                  )}
                  <div className="mt-2.5 flex items-center gap-4 text-xs text-theme-muted/40">
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
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 text-theme-muted/0 group-hover:text-theme-muted/40 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
