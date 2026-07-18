import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@fluid/database';
import { getOrCreatePersonalTeam } from '@/lib/team';
import { DashboardCommandPalette } from './command-palette-wrapper';
import { MobileDrawer } from '@/components/mobile-drawer';
import {
  LayoutDashboard,
  Settings,
  FileText,
  HeartPulse,
  HelpCircle,
  LogOut,
  FolderOpen,
  Code2,
  Upload,
  BarChart3,
  Users,
  User,
  Plug,
  Sparkles,
} from 'lucide-react';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // Check if user needs onboarding
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboarded: true, image: true },
  });
  if (user && !user.onboarded) redirect('/onboarding');

  const [team, firstProject] = await Promise.all([
    getOrCreatePersonalTeam(session.user.id),
    prisma.project.findFirst({
      where: { team: { members: { some: { userId: session.user.id } } } },
      select: { id: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const projects = await prisma.project.findMany({
    where: { teamId: team.id },
    select: { id: true, name: true },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  const firstProjectId = firstProject?.id || projects[0]?.id;

  // Fetch pages for command palette
  const pages = await prisma.docPage.findMany({
    where: { project: { teamId: team.id } },
    select: {
      id: true,
      title: true,
      slug: true,
      projectId: true,
      project: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return (
    <div className="flex min-h-screen bg-theme-page">
      {/* Mobile Drawer */}
      <MobileDrawer
        projects={projects}
        firstProjectId={firstProjectId ?? null}
        userName={session.user.name ?? null}
        userEmail={session.user.email ?? null}
        userImage={user?.image ?? null}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-theme-border bg-theme-card/30">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-theme-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" fill="none" className="h-6 w-6">
              <defs>
                <linearGradient id="logo-side" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#logo-side)" />
              <circle cx="16" cy="16" r="4" fill="white" />
            </svg>
            <span className="text-sm font-bold text-theme-main">TomeBase</span>
          </Link>
        </div>

        {/* Search / Command Palette */}
        <div className="px-3 py-2.5">
          <DashboardCommandPalette
            pages={pages.map((p) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              projectId: p.projectId,
              projectName: p.project.name,
              content: '',
            }))}
            projects={projects}
            currentProjectId={firstProjectId}
          />
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3">
          {/* Workspace */}
          <div className="sidebar-label">Workspace</div>
          <Link
            href="/dashboard"
            className="sidebar-link active"
          >
            <LayoutDashboard />
            Dashboard
          </Link>
          <Link
            href="/dashboard"
            className="sidebar-link"
          >
            <FolderOpen />
            Projects
            <span className="ml-auto text-[11px] text-theme-muted">{projects.length}</span>
          </Link>

          {/* Documentation */}
          {firstProjectId && (
            <>
              <div className="sidebar-label">Documentation</div>
              <Link
                href={`/docs/${firstProjectId}`}
                className="sidebar-link"
              >
                <FileText />
                Editor
              </Link>
              <Link
                href={`/dashboard/${firstProjectId}/import`}
                className="sidebar-link"
              >
                <Upload />
                Import
              </Link>
              <Link
                href={`/dashboard/${firstProjectId}/health`}
                className="sidebar-link"
              >
                <BarChart3 />
                Health
              </Link>
            </>
          )}

          {/* AI */}
          <div className="sidebar-label">AI</div>
          <Link
            href="/dashboard/account/ai"
            className="sidebar-link"
          >
            <Sparkles />
            AI Providers
          </Link>

          {/* Account */}
          <div className="sidebar-label">Account</div>
          <Link
            href="/dashboard/integrations"
            className="sidebar-link"
          >
            <Plug />
            Integrations
          </Link>
          <Link
            href="/dashboard/settings"
            className="sidebar-link"
          >
            <Settings />
            Team Settings
          </Link>
          <Link
            href="/dashboard/account"
            className="sidebar-link"
          >
            <User />
            Account
          </Link>
          <Link
            href="/help"
            className="sidebar-link"
          >
            <HelpCircle />
            Help
          </Link>
        </nav>

        {/* User */}
        <div className="border-t border-theme-border p-3">
          <div className="flex items-center gap-2.5 px-3 py-2">
            {user?.image ? (
              <img
                src={user.image}
                alt={session.user.name || 'User'}
                className="h-8 w-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#E5A50B] to-[#ca8a04] flex items-center justify-center text-[11px] font-bold text-gray-900 shrink-0">
                {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-theme-main truncate">{session.user.name || 'User'}</p>
              <p className="text-[11px] text-theme-muted truncate">{session.user.email}</p>
            </div>
          </div>
          <form
            action={async () => {
              'use server';
              const { signOut } = await import('@/lib/auth');
              await signOut();
            }}
          >
            <button
              type="submit"
              className="sidebar-link w-full"
            >
              <LogOut />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
