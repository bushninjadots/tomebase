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

function buildTree(pages: { id: string; title: string; slug: string; parentId: string | null }[], projectId: string) {
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
          href={`/p/${projectId}/${page.slug}`}
          className="group flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-colors"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <span className="h-1 w-1 rounded-full bg-theme-muted/30 group-hover:bg-theme-accent transition-colors shrink-0" />
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
    <div className="min-h-screen bg-[#0B1020]">
      <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0B1020]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {pages.length > 0 && <PublicMobileNav pages={pages} projectId={projectId} />}
            <Link href={`/p/${projectId}`} className="flex items-center gap-2.5 min-w-0 group">
              <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5 shrink-0">
                <defs>
                  <linearGradient id="pub-logo" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#3B3BFF" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#pub-logo)" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              <span className="truncate text-[13px] font-semibold text-theme-main group-hover:text-theme-accent transition-colors">
                {project.name}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <PublicSearchOverlay projectId={projectId} />
            <CopyLinkButton />
            {!hideBranding && (
              <span className="hidden text-[11px] text-theme-muted/50 sm:inline ml-1">
                Powered by TomeBase
              </span>
            )}
          </div>
        </div>
      </nav>
      <div className="mx-auto flex max-w-6xl">
        {pages.length > 0 && (
          <aside className="hidden w-60 shrink-0 border-r border-white/[0.06] py-5 pl-4 pr-2 lg:block">
            <nav>
              <ul className="space-y-0.5">{buildTree(pages, projectId)}</ul>
            </nav>
          </aside>
        )}
        <main className="min-w-0 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
      {!hideBranding && (
        <div className="border-t border-white/[0.06] py-8 text-center">
          <Link href="https://tomebase.io" className="text-[11px] text-theme-muted/40 hover:text-theme-muted/60 transition-colors">
            Powered by TomeBase
          </Link>
        </div>
      )}
    </div>
  );
}
