'use client';

import { cn } from '@fluid/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
}

const defaultNavItems: NavItem[] = [
  { label: 'Features', href: '/features' },
  { label: 'Docs', href: '/docs' },
  { label: 'Help', href: '/help' },
  { label: 'Pricing', href: '/pricing' },
];

interface NavigationProps {
  items?: NavItem[];
  actions?: React.ReactNode;
}

export function Navigation({ items = defaultNavItems, actions }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-theme-border/60 bg-theme-page/70 backdrop-blur-xl supports-[backdrop-filter]:bg-theme-page/50">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-9">
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg viewBox="0 0 32 32" fill="none" className="h-6 w-6" aria-hidden="true">
              <defs>
                <linearGradient id="nav-logo" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#3B3BFF" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#nav-logo)" />
              <path
                d="M8 16h16M16 8v16M10 10l12 12M22 10L10 22"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.5"
              />
              <circle cx="16" cy="16" r="4" fill="white" />
            </svg>
            <span className="text-[15px] font-bold tracking-tight text-theme-main">
              TomeBase
            </span>
          </Link>
          <div className="hidden items-center gap-0.5 sm:flex">
            {items.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 rounded-md',
                    isActive
                      ? 'text-theme-accent'
                      : 'text-theme-muted hover:text-theme-main',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions ?? (
            <>
              <Link
                href="/login"
                className="hidden px-3 py-1.5 text-[13px] font-medium text-theme-muted transition-colors duration-150 hover:text-theme-main sm:inline-flex"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-lg bg-theme-accent px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-theme-accent-hover hover:shadow-md active:scale-[0.98]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
