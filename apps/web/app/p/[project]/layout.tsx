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

function buildTree(
  pages: { id: string; title: string; slug: string; parentId: string | null }[],
  projectId: string,
  activeSlug?: string
) {
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
    const isActive = page.slug === activeSlug;
    return (
      <li key={page.id}>
        <Link
          href={`/p/${projectId}/${page.slug}`}
          className={`group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
            isActive
              ? 'bg-indigo-500/10 text-[#6366f1] font-medium'
              : 'text-[#9ca3af] hover:bg-white/[0.04] hover:text-[#d1d5db]'
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className={`h-3.5 w-3.5 shrink-0 ${
              isActive ? 'text-[#6366f1]' : 'text-[#4b5563]'
            }`}
          >
            <path
              d="M3 2.5h10a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path d="M5.5 6h5M5.5 8h5M5.5 10h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
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
    <div className="flex min-h-screen bg-[#0a0a0f]">
      {/* Mobile nav */}
      {pages.length > 0 && <PublicMobileNav pages={pages} projectId={projectId} />}

      {/* Left sidebar — fixed, 240px */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-[240px] bg-[#0a0a0f] border-r border-white/[0.06] z-30">
        {/* Logo area */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-white/[0.06]">
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
            <span className="truncate text-[13px] font-semibold text-[#e5e7eb] group-hover:text-[#818cf8] transition-colors">
              {project.name}
            </span>
          </Link>
        </div>

        {/* Page list */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {pages.length > 0 && (
            <ul className="space-y-0.5">{buildTree(pages, projectId)}</ul>
          )}
        </nav>

        {/* Bottom branding */}
        {!hideBranding && (
          <div className="px-4 py-3 border-t border-white/[0.06]">
            <span className="text-[11px] text-[#4b5563]">
              Powered by TomeBase
            </span>
          </div>
        )}
      </aside>

      {/* Right content area */}
      <div className="flex-1 lg:ml-[240px] flex flex-col min-h-screen">
        {/* Top bar */}
        <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile logo (visible < lg) */}
              <Link href={`/p/${projectId}`} className="flex items-center gap-2.5 min-w-0 group lg:hidden">
                <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5 shrink-0">
                  <defs>
                    <linearGradient id="pub-logo-mobile" x1="0" y1="0" x2="32" y2="32">
                      <stop offset="0%" stopColor="#3B3BFF" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                  <rect width="32" height="32" rx="8" fill="url(#pub-logo-mobile)" />
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
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
