import { prisma } from '@fluid/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, FileText, Eye, Clock, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="mt-3 text-lg text-gray-600 max-w-2xl">{project.description}</p>
              )}
            </div>
            {project.customDomain && (
              <span className="shrink-0 rounded-full bg-fluid-50 px-3 py-1 text-xs font-medium text-fluid-700">
                {project.customDomain}
              </span>
            )}
          </div>

          {totalPages > 0 && (
            <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                {totalPages} page{totalPages !== 1 ? 's' : ''}
              </span>
              {totalViews > 0 && (
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  {totalViews} view{totalViews !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        {totalPages === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-200" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">No published pages yet</h2>
            <p className="mt-1 text-sm text-gray-500">
              Check back later for documentation.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {project.pages.map((page) => (
              <Link
                key={page.id}
                href={`/p/${projectId}/${page.slug}`}
                className="group relative rounded-xl border border-gray-100 p-5 transition-all hover:border-fluid-200 hover:shadow-sm hover:-translate-y-0.5"
              >
                <h2 className="font-semibold text-gray-900 group-hover:text-fluid-600 transition-colors">
                  {page.title}
                </h2>
                {page.description && (
                  <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{page.description}</p>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
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
                <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
