'use client';

import { cn } from '@fluid/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const defaultNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Pages',
    href: '/docs',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Import',
    href: '/import',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
  {
    label: 'Health',
    href: '/health',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
];

interface NavigationProps {
  items?: NavItem[];
  actions?: React.ReactNode;
}

export function Navigation({ items = defaultNavItems, actions }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 h-14 border-b border-theme-border bg-theme-page/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center px-5 sm:px-6 lg:px-8">
        {/* Logo cluster */}
        <Link href="/" className="mr-8 flex items-center gap-2.5 shrink-0">
          <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
            <defs>
              <linearGradient id="nav-logo" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#nav-logo)" />
            <circle cx="16" cy="16" r="4" fill="white" />
          </svg>
          <span className="text-[15px] font-bold tracking-tight text-theme-main">
            TomeBase
          </span>
        </Link>

        {/* Primary nav links — left-aligned next to logo */}
        <div className="hidden items-center gap-0.5 sm:flex">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150',
                  isActive
                    ? 'text-theme-accent'
                    : 'text-theme-subtle hover:text-theme-main',
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right-side actions */}
        <div className="flex items-center gap-2.5">
          {actions ?? (
            <>
              {/* Search input */}
              <div className="relative hidden items-center md:flex">
                <svg
                  className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-theme-muted"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search pages..."
                  className="h-8 w-52 rounded-full border border-theme-border bg-theme-card pl-8 pr-12 text-[13px] text-theme-main placeholder-theme-muted outline-none transition-colors focus:border-theme-accent/50"
                />
                <kbd className="pointer-events-none absolute right-2.5 inline-flex h-5 items-center rounded border border-theme-border bg-theme-hover px-1.5 font-mono text-[10px] font-medium text-theme-muted">
                  ⌘K
                </kbd>
              </div>

              {/* + New Page button */}
              <Link
                href="/dashboard/new"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-3 text-[13px] font-medium text-theme-main transition-colors hover:border-theme-accent/30 hover:bg-theme-hover"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Page
              </Link>

              {/* Avatar */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-[13px] font-bold text-white">
                T
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
