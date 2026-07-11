'use client';

import { cn } from '@fluid/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Logo } from './logo';

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
    <nav className="sticky top-0 z-50 border-b border-theme-border bg-theme-page/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Link href="/">
            <Logo />
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === item.href || pathname?.startsWith(item.href + '/')
                    ? 'text-theme-accent bg-theme-accent-light'
                    : 'text-theme-subtle hover:text-theme-main hover:bg-theme-hover',
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {actions}
        </div>
      </div>
    </nav>
  );
}
