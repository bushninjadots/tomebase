import { prisma } from '@fluid/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
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
        select: { id: true, title: true, slug: true, description: true },
      },
    },
  });

  if (!project || !project.published) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">{project.name}</h1>
        {project.description && (
          <p className="mt-3 text-lg text-gray-600">{project.description}</p>
        )}
      </div>

      {project.pages.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">No published pages yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {project.pages.map((page) => (
            <Link
              key={page.id}
              href={`/p/${projectId}/${page.slug}`}
              className="block rounded-xl border border-gray-100 p-5 transition-all hover:border-fluid-200 hover:shadow-sm"
            >
              <h2 className="font-semibold text-gray-900">{page.title}</h2>
              {page.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{page.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
