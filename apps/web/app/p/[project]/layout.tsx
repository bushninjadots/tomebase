import { prisma } from '@fluid/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ project: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { project: projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project || !project.published) return { title: 'Not Found' };

  return {
    title: `${project.name} — Fluid Docs`,
    description: project.description ?? undefined,
  };
}

export default async function PublicLayout({ children, params }: LayoutProps) {
  const { project: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { published: true, name: true, customDomain: true },
  });

  if (!project || !project.published) notFound();

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href={`/p/${projectId}`} className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" fill="none" className="h-6 w-6">
              <rect width="32" height="32" rx="8" fill="#0c8ee7" />
              <circle cx="16" cy="16" r="4" fill="white" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">{project.name}</span>
          </Link>
          <span className="text-xs text-gray-400">Powered by Fluid</span>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
