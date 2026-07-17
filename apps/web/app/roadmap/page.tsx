import { Container } from '@fluid/ui';
import Link from 'next/link';
import { CheckCircle, Circle, Clock, Zap, ArrowRight, Github, Mail } from 'lucide-react';
import { MarketingNav } from '@/components/marketing-nav';

const shipped = [
  { label: 'Auth (email/password, GitHub, Google OAuth)' },
  { label: 'Dashboard with stats, usage meter, project cards' },
  { label: 'Markdown editor — split pane, live preview, auto-save' },
  { label: 'Wiki links ([[Page Name]]) with autocomplete' },
  { label: 'Hierarchical page tree with reorder & indent/outdent' },
  { label: 'Page templates with cross-linking wiki links' },
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
  { label: 'Code import — TypeScript, JavaScript, Python, Go, Rust' },
  { label: 'Export to Markdown (.zip with frontmatter)' },
  { label: 'Doc health scans (broken links, orphans, empty pages)' },
  { label: 'SEO — sitemap, canonical URLs, Open Graph' },
  { label: 'Public search (Cmd+K on published docs)' },
  { label: 'Landing page with stats and pricing' },
  { label: 'Onboarding checklist for new users' },
  { label: 'Tier limits (Free/Pro) with usage metering' },
  { label: 'Pricing page with comparison table' },
  { label: 'GitHub sync (connect repo, import .md files)' },
  { label: 'Webhook notifications (page create/update/publish)' },
  { label: 'Scheduled publishing (future dates)' },
  { label: 'Bookmarks — save pages for quick access' },
  { label: 'Guided tutorial for first-time users' },
  { label: 'Page comments & discussions with @mentions' },
  { label: 'Revision diff — snapshot comparison' },
  { label: 'Breadcrumb navigation across dashboard' },
  { label: 'Stripe billing (Checkout + Portal + webhooks)' },
  { label: '2-tier pricing (Free €0 / Pro €15)' },
  { label: 'Security hardening (rate limiting, SSRF, auth guards)' },
  { label: 'CI/CD via GitHub Actions' },
  { label: 'Documentation Health Platform — SonarQube for docs' },
  { label: 'Health engine — 12 check categories, per-page scoring' },
  { label: 'Health dashboard — score breakdown, recommendations' },
  { label: 'Health report persistence — historical trend tracking' },
  { label: 'Theme system — 5 themes (dark/light/gruvbox/dracula/nord)' },
  { label: 'Full theme migration — all UI uses CSS variables' },
  { label: 'Test suite — 84 Vitest unit/integration tests' },
  { label: 'Global navigation — consistent top nav on all pages' },
  { label: 'Custom domain management — Vercel API integration' },
  { label: 'Multi-language code import — Python, Go, Rust parsers' },
];

const categories = [
  {
    title: 'Now',
    icon: Zap,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    items: [
      'Documentation Linter — ESLint for docs, CI/CD integration',
      'Documentation Testing — validate commands, code, examples',
      'Migration tool — import from GitBook, Mintlify, Docusaurus, Notion',
      'Email notifications for comments, @mentions, and invites',
    ],
  },
  {
    title: 'Next',
    icon: Clock,
    color: 'text-theme-accent bg-theme-accent/10 border-theme-accent/20',
    items: [
      'Documentation Observatory — cross-platform dashboard',
      'Global search across all projects',
      'GitHub/GitLab sync — connect repo, auto-import .md files',
      'Self-hosted deployment guide (Docker Compose)',
      'Collaborative editing — real-time multi-user',
      'Page-level permissions — granular access control',
    ],
  },
  {
    title: 'Later',
    icon: Circle,
    color: 'text-theme-muted bg-theme-hover border-theme-border',
    items: [
      'SSO/SAML (single sign-on)',
      'Audit log for compliance',
      'Read-only sharing links',
      'Plugin system (custom blocks, themes)',
      'Community marketplace for templates',
      'Multi-region edge delivery',
      'AI writing assistant — smart suggestions, auto-summarize, rewrite',
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-theme-page">
      <MarketingNav />
      <section className="pt-24 pb-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-theme-accent/20 bg-theme-accent-light px-4 py-1.5 text-xs font-medium text-theme-accent">
              <Github className="h-3.5 w-3.5" />
              Open source · Active development
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-theme-main sm:text-5xl">
              Public Roadmap
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-theme-subtle">
              TomeBase is in active development. Here&apos;s what we&apos;ve shipped
              and what&apos;s coming next.
            </p>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 sm:grid-cols-3 gap-6 text-center">
            <div className="rounded-2xl border border-theme-border bg-theme-card p-5">
              <div className="text-2xl font-bold text-theme-main">30+</div>
              <div className="mt-0.5 text-xs text-theme-muted">API routes</div>
            </div>
            <div className="rounded-2xl border border-theme-border bg-theme-card p-5">
              <div className="text-2xl font-bold text-green-400">{shipped.length}</div>
              <div className="mt-0.5 text-xs text-theme-muted">Features shipped</div>
            </div>
            <div className="rounded-2xl border border-theme-border bg-theme-card p-5">
              <div className="text-2xl font-bold text-theme-main">{categories.reduce((acc, c) => acc + c.items.length, 0)}</div>
              <div className="mt-0.5 text-xs text-theme-muted">In progress / planned</div>
            </div>
          </div>

          {/* Shipped */}
          <div className="mx-auto mt-16 max-w-2xl">
            <h2 className="flex items-center gap-2 text-xl font-bold text-theme-main mb-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Shipped
            </h2>
            <p className="text-sm text-theme-subtle mb-6">Everything available in TomeBase today.</p>
            <div className="grid gap-2">
              {shipped.map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-2.5">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-400" />
                  <span className="text-sm text-theme-subtle">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Planned */}
          <div className="mx-auto mt-20 max-w-2xl">
            <h2 className="flex items-center gap-2 text-xl font-bold text-theme-main mb-1">
              <Clock className="h-5 w-5 text-theme-accent" />
              Planned
            </h2>
            <p className="text-sm text-theme-subtle mb-6">What we&apos;re building next. Priorities may shift based on feedback.</p>
            <div className="space-y-8">
              {categories.map((cat) => (
                <div key={cat.title}>
                  <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cat.color}`}>
                    <cat.icon className="h-3 w-3" />
                    {cat.title}
                  </div>
                  <div className="grid gap-2">
                    {cat.items.map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-xl border border-theme-border bg-theme-card px-4 py-2.5">
                        <Circle className="h-4 w-4 shrink-0 text-theme-muted" />
                        <span className="text-sm text-theme-subtle">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mx-auto mt-20 max-w-lg text-center rounded-2xl border border-theme-border bg-theme-card p-8">
            <h2 className="text-lg font-semibold text-theme-main">Have feedback?</h2>
            <p className="mt-2 text-sm text-theme-subtle">
              Open an issue on GitHub or email us directly.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="https://github.com/bushninjadots/tomebase/issues"
                className="inline-flex items-center gap-2 btn-primary text-sm"
              >
                <Github className="h-4 w-4" />
                GitHub Issue
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 btn-secondary text-sm"
              >
                <Mail className="h-4 w-4" />
                Contact Us
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <footer className="border-t border-theme-border py-12">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-theme-muted">
              <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5" aria-hidden="true">
                <defs>
                  <linearGradient id="logo-footer-rm" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#logo-footer-rm)" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              TomeBase — Your knowledge base.
            </div>
            <div className="flex items-center gap-6 text-sm text-theme-muted">
              <Link href="/pricing" className="hover:text-theme-main transition-colors">Pricing</Link>
              <span className="text-theme-border">&middot;</span>
              <Link href="/roadmap" className="hover:text-theme-main transition-colors">Roadmap</Link>
              <span className="text-theme-border">&middot;</span>
              <Link href="/contact" className="hover:text-theme-main transition-colors">Contact</Link>
              <span className="text-theme-border">&middot;</span>
              <Link href="https://github.com/bushninjadots/tomebase" className="hover:text-theme-main transition-colors">GitHub</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
