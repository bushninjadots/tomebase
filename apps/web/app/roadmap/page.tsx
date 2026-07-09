import { Container } from '@fluid/ui';
import Link from 'next/link';
import { CheckCircle, Circle, Clock, Zap, ArrowRight, Github } from 'lucide-react';

const shipped = [
  { label: 'Auth (email/password, GitHub, Google OAuth)' },
  { label: 'Dashboard with stats, usage meter, project cards' },
  { label: 'Markdown editor — split pane, live preview, auto-save' },
  { label: 'Wiki links ([[Page Name]]) with autocomplete' },
  { label: 'Hierarchical page tree with reorder & indent/outdent' },
  { label: '9 page templates with cross-linking wiki links' },
  { label: 'Full-text search (Cmd+K, title + content, snippets)' },
  { label: 'Force-directed graph view (local/global, drag, zoom)' },
  { label: 'Obsidian-style callout blocks (12 types)' },
  { label: 'Tags (#tag) extraction and sidebar filtering' },
  { label: 'Backlinks panel in editor footer' },
  { label: 'Public docs hosting with sidebar navigation' },
  { label: 'Custom domains (DNS instructions + middleware)' },
  { label: 'Page view analytics (counter, dashboard stats)' },
  { label: 'Version history (snapshots, browse, restore)' },
  { label: 'Team invites with admin/member roles' },
  { label: 'API key management (tb_ prefix, expiry)' },
  { label: 'OpenAPI spec import (JSON/YAML, endpoint pages)' },
  { label: 'Code import (TypeScript/JavaScript JSDoc)' },
  { label: 'Export to Markdown (.zip with frontmatter)' },
  { label: 'Doc health scans (broken links, orphans, empty pages)' },
  { label: 'SEO — sitemap, canonical URLs, Open Graph' },
  { label: 'Public search (Cmd+K on published docs)' },
  { label: 'Landing page with stats and pricing' },
  { label: 'Onboarding checklist for new users' },
  { label: 'Tier limits (Free/Pro/Enterprise) with usage metering' },
  { label: 'Pricing page with comparison table' },
];

const categories = [
  {
    title: 'High Priority',
    icon: Zap,
    color: 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-900/50',
    items: [
      'Revision diff — side-by-side snapshot comparison',
      'Page comments & discussions with @mentions',
      'Stripe billing integration',
      'AI writing assistant (suggestions, summarize, rewrite)',
    ],
  },
  {
    title: 'Medium Priority',
    icon: Clock,
    color: 'text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-900/50',
    items: [
      'GitHub/GitLab sync (connect repo, auto-import .md)',
      'Webhook notifications (page create/update/publish)',
      'Scheduled publishing (future dates)',
      'Bookmarks — save pages for quick access',
      'Guided tutorial for first-time users',
    ],
  },
  {
    title: 'Future',
    icon: Circle,
    color: 'text-gray-600 bg-gray-50 border-gray-100 dark:text-gray-400 dark:bg-gray-900/50 dark:border-gray-800',
    items: [
      'SSO/SAML (enterprise single sign-on)',
      'Audit log for compliance',
      'Read-only sharing links',
      'Mobile responsive editor',
      'Self-hosted deployment (Docker + PostgreSQL)',
      'Plugin system (custom blocks, themes)',
      'Community marketplace for templates',
      'Multi-region edge delivery',
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="gradient-bg">
      <nav className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/70 backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-950/70">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8" aria-hidden="true">
                <defs>
                  <linearGradient id="logo-nav-r" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#0c8ee7" />
                    <stop offset="100%" stopColor="#7cc8fb" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#logo-nav-r)" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              <span className="text-lg font-bold tracking-tight dark:text-white">TomeBase</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/pricing" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-white">Pricing</Link>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-white">Sign in</Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </nav>

      <section className="py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-fluid-200 bg-fluid-50/50 px-4 py-1.5 text-xs font-medium text-fluid-700">
              <Github className="h-3.5 w-3.5" />
              Open source · Active development
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
              Public Roadmap
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-400">
              TomeBase is in active development. Here&apos;s what we&apos;ve shipped
              and what&apos;s coming next.
            </p>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-6 text-center">
            <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">43</div>
              <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">API routes</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">27</div>
              <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Features shipped</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">17</div>
              <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">In progress / planned</div>
            </div>
          </div>

          {/* Shipped */}
          <div className="mx-auto mt-16 max-w-2xl">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-1 dark:text-white">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Shipped
            </h2>
            <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">Everything available in TomeBase today.</p>
            <div className="grid gap-2">
              {shipped.map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-lg border border-green-100 bg-green-50/30 px-4 py-2.5 dark:border-green-900/50 dark:bg-green-950/30">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Planned */}
          <div className="mx-auto mt-20 max-w-2xl">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-1 dark:text-white">
              <Clock className="h-5 w-5 text-fluid-600" />
              Planned
            </h2>
            <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">What we&apos;re building next. Priorities may shift based on feedback.</p>
            <div className="space-y-8">
              {categories.map((cat) => (
                <div key={cat.title}>
                  <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cat.color}`}>
                    <cat.icon className="h-3 w-3" />
                    {cat.title}
                  </div>
                  <div className="grid gap-2">
                    {cat.items.map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900">
                        <Circle className="h-4 w-4 shrink-0 text-gray-300" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mx-auto mt-20 max-w-lg text-center rounded-2xl border border-gray-100 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Have feedback?</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Open an issue on GitHub to report bugs, request features, or vote on what we build next.
            </p>
            <Link
              href="https://github.com/anomalyco/fluid/issues"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              <Github className="h-4 w-4" />
              Open a GitHub Issue
            </Link>
          </div>
        </Container>
      </section>

      <footer className="border-t border-gray-100 py-12 dark:border-gray-800">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="#0c8ee7" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              TomeBase — Your knowledge base.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <Link href="/pricing" className="hover:text-gray-900 transition-colors dark:hover:text-white">Pricing</Link>
              <span className="text-gray-200">·</span>
              <Link href="/roadmap" className="hover:text-gray-900 transition-colors dark:hover:text-white">Roadmap</Link>
              <span className="text-gray-200">·</span>
              <Link href="https://github.com/anomalyco/fluid" className="hover:text-gray-900 transition-colors dark:hover:text-white">GitHub</Link>
              <span className="text-gray-200">·</span>
              <Link href="/terms" className="hover:text-gray-900 transition-colors dark:hover:text-white">Terms</Link>
              <Link href="/privacy" className="hover:text-gray-900 transition-colors dark:hover:text-white">Privacy</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
