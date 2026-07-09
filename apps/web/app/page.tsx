import Link from 'next/link';
import { Container } from '@fluid/ui';
import { ArrowRight, BookOpen, Code2, GitBranch, Search, Sparkles, FileText, Hash, Network, Users, ExternalLink, Zap, Shield, Globe, Layers } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Documentation Editor',
    description: 'Full-featured Markdown editor with live preview, auto-save, and formatting toolbar. Organize pages in a hierarchical tree with drag-free reordering.',
    details: [
      'Auto-save with 2-second debounce — never lose your work',
      'Live Markdown preview with wiki link resolution',
      'Formatting toolbar: headings, bold, italic, links, code, lists, blockquotes',
      'Page templates: Getting Started, API Reference, Troubleshooting, Release Notes',
      'Hierarchical sidebar with drag-free move up/down and indent/outdent',
    ],
  },
  {
    icon: GitBranch,
    title: 'Wiki Links & Backlinks',
    description: 'Connect your documentation with wiki-style [[links]]. See which pages reference the current page, and navigate your knowledge graph effortlessly.',
    details: [
      'Wiki link syntax: [[Page Name]] auto-links to any page in your project',
      'Backlinks panel below each page shows all referring pages',
      'Force-directed graph view visualizes your entire documentation network',
      'Cmd+K search finds pages by title and full-text content',
      'Tag pages with #tags, filter sidebar by tag',
    ],
  },
  {
    icon: Code2,
    title: 'Public Documentation',
    description: 'Publish your documentation to the world with a single toggle. Each project gets its own public URL at /p/[project].',
    details: [
      'Toggle publish on/off per project from settings',
      'Public pages rendered at /p/[project]/[slug] — no auth required',
      'SEO metadata with Open Graph and Twitter cards',
      'Wiki links work in published docs — navigation stays seamless',
      'Full content search available on public pages',
    ],
  },
  {
    icon: Sparkles,
    title: 'AI Integration',
    description: 'Auto-generate documentation from your source code. Parse TypeScript/JavaScript files into structured Markdown docs.',
    details: [
      'Codegen endpoint parses functions, interfaces, types, enums, classes',
      'Extracts JSDoc comments as descriptions',
      'Generates clean Markdown ready to publish',
      'TypeScript and JavaScript support',
      'AI chat and smart suggestions coming soon',
    ],
  },
  {
    icon: Search,
    title: 'Full-Text Search',
    description: 'Find anything instantly across all your documentation. Searches both titles and content with relevant snippets.',
    details: [
      'Cmd+K / Ctrl+K search palette from anywhere in the editor',
      'Searches page titles and full content',
      'Shows contextual snippets around matches',
      'Keyboard-navigable results with arrow keys',
      'Tag-based filtering in the sidebar',
    ],
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite your team, assign roles, and collaborate on documentation together. Free tier supports up to 3 members.',
    details: [
      'Team invite links with 7-day expiry',
      'Admin and member roles with appropriate permissions',
      'Personal team auto-created on signup',
      'Usage dashboard with page counts and member limits',
      'Tier-based limits: Free (3 members), Pro (15), Enterprise (100)',
    ],
  },
  {
    icon: Shield,
    title: 'API Key Management',
    description: 'Generate API keys for programmatic access to your documentation. Create, manage, and revoke keys from project settings.',
    details: [
      'Create scoped API keys with optional expiry dates',
      'Prefix-identified keys (fl_) for easy recognition',
      'One-time display after creation — copy it immediately',
      'Revoke keys instantly from project settings',
      'Perfect for CI/CD pipelines and automation',
    ],
  },
  {
    icon: Globe,
    title: 'Custom Domains',
    description: 'Host your documentation on your own domain. Pro and Enterprise plans support custom domains for branded docs sites.',
    details: [
      'Custom domain support on Pro and Enterprise plans',
      'SSL certificates automatically provisioned',
      'Point your CNAME and we handle the rest',
      'Seamless integration with your existing site',
      'White-label option on Enterprise',
    ],
  },
];

export default function Home() {
  return (
    <div className="gradient-bg">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/70 backdrop-blur-xl">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8" aria-hidden="true">
                <defs>
                  <linearGradient id="logo-nav" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#0c8ee7" />
                    <stop offset="100%" stopColor="#7cc8fb" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#logo-nav)" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              <span className="text-lg font-bold tracking-tight">Fluid</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/features"
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
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

      {/* Hero */}
      <section className="relative overflow-hidden pb-24 pt-20 sm:pb-32 sm:pt-28">
        <div className="hero-glow -left-40 -top-40" />
        <div className="hero-glow -right-40 -bottom-40" />
        <Container>
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-fluid-200 bg-fluid-50/50 px-4 py-1.5 text-xs font-medium text-fluid-700">
              <Zap className="h-3.5 w-3.5" />
              Open source · Free tier available
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Knowledge that{' '}
              <span className="gradient-text">flows into action</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
              Fluid auto-generates beautiful API documentation from your codebase,
              keeps every change tracked, and makes your team&apos;s
              knowledge effortless to maintain.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800 transition-colors shadow-lg"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                View Demo
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">No credit card required · Free tier included</p>
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Three steps to go from zero to published documentation.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fluid-50 text-fluid-600">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">1. Create pages</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Write documentation in Markdown with live preview. Use templates, wiki links, and tags to structure your knowledge. The editor auto-saves every change.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fluid-50 text-fluid-600">
                <Layers className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">2. Organize & connect</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Nest pages in a hierarchy, link them with wiki syntax, and tag them by topic. The graph view shows how everything connects. Your documentation grows organically.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fluid-50 text-fluid-600">
                <Globe className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">3. Share & publish</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Share invite links with your team to collaborate. Toggle public publishing for a live docs site. Generate API keys for programmatic access. Host on your own domain with Pro.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything your team needs to document
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From a powerful editor to public hosting — Fluid has you covered.
            </p>
          </div>
          <div className="mt-16 space-y-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-fluid-200 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fluid-50 text-fluid-600 group-hover:bg-fluid-100 transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{feature.description}</p>
                    <ul className="mt-3 space-y-1">
                      {feature.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2 text-sm text-gray-500">
                          <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to make your docs flow?
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Join teams that use Fluid to keep their knowledge in sync and their developers happy.
            </p>
            <div className="mt-10">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 transition-colors"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5" aria-hidden="true">
                <defs>
                  <linearGradient id="logo-footer" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#0c8ee7" />
                    <stop offset="100%" stopColor="#7cc8fb" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#logo-footer)" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              Fluid — Knowledge that flows into action.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/docs" className="hover:text-gray-900 transition-colors">Docs</Link>
              <Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
              <Link href="/features" className="hover:text-gray-900 transition-colors">Features</Link>
              <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
