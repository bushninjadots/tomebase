import { prisma } from '@fluid/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Hash } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { ViewTracker } from '@/components/view-tracker';
import { extractTags } from '@/lib/wiki';
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
    select: { title: true, slug: true },
  });

  const tags = extractTags(page.content);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href={`/p/${projectId}`}
        className="mb-8 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {project.name}
      </Link>

      <article>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">{page.title}</h1>
        {page.description && (
          <p className="mb-4 text-lg text-gray-500">{page.description}</p>
        )}
        {tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-fluid-50 px-2.5 py-0.5 text-xs font-medium text-fluid-700"
              >
                <Hash className="mr-0.5 h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 pt-8">
          <Markdown
            content={page.content}
            projectId={projectId}
            pages={allPages}
            basePath={`/p/${projectId}`}
          />
        </div>
      </article>

      <ViewTracker pageId={page.id} />

      <div className="mt-16 border-t border-gray-100 pt-6 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <span>Last updated: {new Date(page.updatedAt).toLocaleDateString()}</span>
          {page.viewCount > 0 && (
            <span className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {page.viewCount} view{page.viewCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
