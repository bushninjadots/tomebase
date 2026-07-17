'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Settings, FileText, HeartPulse, HelpCircle,
  LogOut, FolderOpen, Upload, BarChart3, User, Plug, X, Menu,
} from 'lucide-react';
import { signOutAction } from '@/app/dashboard/sign-out-action';

interface MobileDrawerProps {
  projects: Array<{ id: string; name: string }>;
  firstProjectId: string | null;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
}

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Projects', icon: FolderOpen, href: '/dashboard' },
];

const DOC_ITEMS = [
  { label: 'Editor', icon: FileText, suffix: '/docs/{id}' },
  { label: 'Import', icon: Upload, suffix: '/dashboard/{id}/import' },
  { label: 'Health', icon: BarChart3, suffix: '/dashboard/{id}/health' },
];

const ACCOUNT_ITEMS = [
  { label: 'Integrations', icon: Plug, href: '/dashboard/integrations' },
  { label: 'Team Settings', icon: Settings, href: '/dashboard/settings' },
  { label: 'Account', icon: User, href: '/dashboard/account' },
  { label: 'Help', icon: HelpCircle, href: '/help' },
];

export function MobileDrawer({ projects, firstProjectId, userName, userEmail, userImage }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);

  // Close on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (href: string) => pathname === href;

  const resolveHref = (suffix: string) => {
    if (!firstProjectId) return '#';
    return suffix.replace('{id}', firstProjectId);
  };

  return (
    <>
      {/* Hamburger button - only visible on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-30 flex h-11 w-11 items-center justify-center rounded-lg bg-theme-card border border-theme-border md:hidden -webkit-tap-highlight-color: transparent"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5 text-theme-subtle" />
      </button>

      {/* Overlay */}
      <div
        className={`mobile-drawer-overlay ${open ? 'open' : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className={`mobile-drawer ${open ? 'open' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-border px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={close}>
            <svg viewBox="0 0 32 32" fill="none" className="h-6 w-6">
              <defs>
                <linearGradient id="logo-drawer" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#logo-drawer)" />
              <circle cx="16" cy="16" r="4" fill="white" />
            </svg>
            <span className="text-sm font-bold text-theme-main">TomeBase</span>
          </Link>
          <button
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3">
          {/* Workspace */}
          <div className="sidebar-label">Workspace</div>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={close}
            >
              <item.icon />
              {item.label}
            </Link>
          ))}

          {/* Documentation */}
          {firstProjectId && (
            <>
              <div className="sidebar-label">Documentation</div>
              {DOC_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={resolveHref(item.suffix)}
                  className={`sidebar-link ${isActive(resolveHref(item.suffix)) ? 'active' : ''}`}
                  onClick={close}
                >
                  <item.icon />
                  {item.label}
                </Link>
              ))}
            </>
          )}

          {/* Account */}
          <div className="sidebar-label">Account</div>
          {ACCOUNT_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={close}
            >
              <item.icon />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-theme-border p-3">
          <div className="flex items-center gap-2.5 px-3 py-2">
            {userImage ? (
              <img
                src={userImage}
                alt={userName || 'User'}
                className="h-8 w-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#E5A50B] to-[#ca8a04] flex items-center justify-center text-[11px] font-bold text-gray-900 shrink-0">
                {userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-theme-main truncate">{userName || 'User'}</p>
              <p className="text-[11px] text-theme-muted truncate">{userEmail}</p>
            </div>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="sidebar-link w-full">
              <LogOut />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
