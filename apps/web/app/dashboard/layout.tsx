import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@fluid/database';
import { getOrCreatePersonalTeam } from '@/lib/team';
import {
  LayoutDashboard,
  Settings,
  FileText,
  HeartPulse,
  HelpCircle,
  LogOut,
} from 'lucide-react';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const team = await getOrCreatePersonalTeam(session.user.id);
  const projects = await prisma.project.findMany({
    where: { teamId: team.id },
    select: { id: true, name: true },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  const firstProjectId = projects[0]?.id;

  return (
    <div className="flex min-h-screen bg-theme-page">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-theme-border bg-theme-card/50">
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

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-theme-main bg-theme-hover transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-theme-accent" />
            Dashboard
          </Link>
          {firstProjectId && (
            <>
              <Link
                href={`/docs/${firstProjectId}`}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-colors"
              >
                <FileText className="h-4 w-4" />
                Editor
              </Link>
              <Link
                href={`/dashboard/${firstProjectId}/health`}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-colors"
              >
                <HeartPulse className="h-4 w-4" />
                Health
              </Link>
            </>
          )}
          <Link
            href="/help"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            Help
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>

        {/* User */}
        <div className="border-t border-theme-border p-3">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white">
              {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
            </div>
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
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-theme-subtle hover:bg-theme-hover hover:text-theme-main transition-colors"
            >
              <LogOut className="h-4 w-4" />
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
