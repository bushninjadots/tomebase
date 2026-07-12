'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@fluid/utils';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '/features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Docs', href: '/docs' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'GitHub', href: 'https://github.com/bushninjadots/tomebase', external: true },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300',
          scrolled
            ? 'border-b border-theme-border bg-theme-page/80 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center px-5 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="mr-10 flex items-center gap-2.5 shrink-0">
            <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
              <defs>
                <linearGradient id="mktg-logo" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#mktg-logo)" />
              <circle cx="16" cy="16" r="4" fill="white" />
            </svg>
            <span className="text-[15px] font-bold tracking-tight text-theme-main">
              TomeBase
            </span>
          </Link>

          {/* Center nav links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-150',
                  pathname === link.href
                    ? 'text-theme-main'
                    : 'text-theme-subtle hover:text-theme-main',
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-lg border border-theme-border bg-transparent px-4 py-2 text-[13px] font-semibold text-theme-main transition-all hover:border-theme-accent/30 hover:bg-theme-hover"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-theme-accent px-4 py-2 text-[13px] font-semibold text-gray-900 shadow-[0_2px_12px_rgba(229,165,11,0.3)] transition-all hover:bg-theme-accent-hover hover:shadow-[0_4px_20px_rgba(229,165,11,0.45)]"
            >
              Start Free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="ml-4 flex h-9 w-9 items-center justify-center rounded-lg border border-theme-border text-theme-subtle transition-colors hover:text-theme-main md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative mx-4 mt-2 rounded-xl border border-theme-border bg-theme-card p-4 shadow-2xl">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  className={cn(
                    'rounded-lg px-4 py-2.5 text-[14px] font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-theme-accent-light text-theme-accent'
                      : 'text-theme-subtle hover:bg-theme-hover hover:text-theme-main',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-theme-border pt-4">
              <Link
                href="/login"
                className="rounded-lg border border-theme-border px-4 py-2.5 text-center text-[14px] font-semibold text-theme-main transition-colors hover:bg-theme-hover"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-theme-accent px-4 py-2.5 text-center text-[14px] font-semibold text-white transition-colors hover:bg-theme-accent-hover"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
