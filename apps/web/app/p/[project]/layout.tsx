import { prisma } from '@fluid/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PublicSearchOverlay } from '@/components/public-search';
import { CopyLinkButton } from '@/components/copy-link';
import { PublicMobileNav } from './mobile-nav';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ project: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { project: projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project || !project.published) return { title: 'Not Found' };

  let hideBranding = false;
  if (project.teamId) {
    const { TIERS, getTeamTier } = await import('@/lib/limits');
    const tier = await getTeamTier(project.teamId);
    hideBranding = TIERS[tier].hideBranding;
  }

  return {
    title: hideBranding ? project.name : `${project.name} — TomeBase Docs`,
    description: project.description ?? undefined,
  };
}

function buildTree(pages: { id: string; title: string; slug: string; parentId: string | null }[]) {
  const map = new Map<string, typeof pages>();
  const roots: typeof pages = [];

  for (const page of pages) {
    if (!page.parentId) {
      roots.push(page);
    } else {
      const existing = map.get(page.parentId) || [];
      existing.push(page);
      map.set(page.parentId, existing);
    }
  }

  function renderBranch(page: (typeof pages)[number], depth: number): React.ReactNode {
    const children = map.get(page.id) || [];
    return (
      <li key={page.id}>
        <Link
          href={`/p/${page.slug}`}
          className="block rounded-lg px-3 py-1.5 text-sm text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-colors"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {page.title}
        </Link>
        {children.length > 0 && (
          <ul className="mt-0.5 space-y-0.5">
            {children.map((child) => renderBranch(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  }

  return roots.map((page) => renderBranch(page, 0));
}

export default async function PublicLayout({ children, params }: LayoutProps) {
  const { project: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { published: true, name: true, customDomain: true, teamId: true },
  });

  if (!project || !project.published) notFound();

  let hideBranding = false;
  if (project.teamId) {
    const { TIERS, getTeamTier } = await import('@/lib/limits');
    const tier = await getTeamTier(project.teamId);
    hideBranding = TIERS[tier].hideBranding;
  }

  const pages = await prisma.docPage.findMany({
    where: { projectId, published: true },
    select: { id: true, title: true, slug: true, parentId: true },
    orderBy: [{ order: 'asc' }],
  });

  return (
    <div className="min-h-screen bg-theme-page">
      <nav className="border-b border-theme-border bg-theme-page">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2 min-w-0">
            {pages.length > 0 && <PublicMobileNav pages={pages} projectId={projectId} />}
            <Link href={`/p/${projectId}`} className="flex items-center gap-2 min-w-0">
              <svg viewBox="0 0 32 32" fill="none" className="h-6 w-6 shrink-0">
                <rect width="32" height="32" rx="8" fill="#0c8ee7" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              <span className="truncate text-sm font-semibold text-theme-main">{project.name}</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PublicSearchOverlay projectId={projectId} />
            <CopyLinkButton />
            {!hideBranding && <span className="hidden text-xs text-theme-muted sm:inline">Powered by TomeBase</span>}
          </div>
        </div>
      </nav>
      <div className="mx-auto flex max-w-6xl">
        {pages.length > 0 && (
          <aside className="hidden w-64 shrink-0 border-r border-theme-border p-4 lg:block">
            <nav>
              <ul className="space-y-0.5">{buildTree(pages)}</ul>
            </nav>
          </aside>
        )}
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
