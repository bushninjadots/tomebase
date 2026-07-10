import Link from 'next/link';
import { GlobalSearch } from '@/components/global-search';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeSelector } from '@/components/theme-selector';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="#0c8ee7" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              <span className="text-sm font-bold tracking-tight dark:text-white">TomeBase</span>
            </Link>
          </div>

          <div className="hidden sm:block flex-1 max-w-sm">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-1">
            <ThemeSelector />
            <NotificationBell />
            <Link
              href="/dashboard/settings"
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              Team
            </Link>
            <form
              action={async () => {
                'use server';
                const { signOut } = await import('@/lib/auth');
                await signOut();
              }}
            >
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}
