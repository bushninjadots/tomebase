import Link from 'next/link';
import { Container } from '@fluid/ui';
import {
  ArrowRight,
  BookOpen,
  GitBranch,
  History,
  Globe,
  Users,
  KeyRound,
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Markdown Editor',
    description:
      'Full-featured Markdown with live preview, syntax highlighting, auto-save, and a hierarchical page tree.',
  },
  {
    icon: GitBranch,
    title: 'Wiki Links & Graph',
    description:
      'Connect pages with [[wiki links]] and visualize your knowledge graph with an interactive force-directed view.',
  },
  {
    icon: History,
    title: 'Version History',
    description:
      'Every edit is tracked. Browse, compare, and restore any previous version of a page in a single click.',
  },
  {
    icon: Globe,
    title: 'Public Hosting',
    description:
      'Publish docs with one toggle. Custom domains, SEO metadata, and a polished reading experience built in.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Invite teammates, assign roles, and collaborate in real-time. Free tier includes up to 5 members.',
  },
  {
    icon: KeyRound,
    title: 'API Key Access',
    description:
      'Generate scoped API keys for CI/CD pipelines. Import, export, and manage docs programmatically.',
  },
];

const stats = [
  { value: '17', label: 'Templates' },
  { value: '5', label: 'Export Formats' },
  { value: '12', label: 'Health Checks' },
];

export default function Home() {
  return (
    <div className="bg-theme-page">
      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 border-b border-theme-border bg-theme-page/80 backdrop-blur-xl">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                className="h-8 w-8"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="logo-nav" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#3B3BFF" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
                <rect
                  width="32"
                  height="32"
                  rx="8"
                  fill="url(#logo-nav)"
                />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              <span className="text-lg font-bold tracking-tight text-theme-main">
                TomeBase
              </span>
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/pricing"
                className="text-sm font-medium text-theme-subtle hover:text-theme-main transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                className="text-sm font-medium text-theme-subtle hover:text-theme-main transition-colors"
              >
                Docs
              </Link>
              <Link
                href="/login"
                className="btn-secondary !py-2 !px-4 !text-sm"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="btn-primary !py-2 !px-4 !text-sm"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="hero-glow -left-40 -top-40" />
        <div className="hero-glow -right-40 -bottom-40" />

        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #F5F5F5 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <Container>
          <div className="relative mx-auto max-w-4xl text-center py-32">
            <p className="eyebrow mb-6">Developer Docs Platform</p>

            <h1 className="text-5xl font-extrabold tracking-tight text-theme-main sm:text-6xl lg:text-7xl">
              Developer documentation{' '}
              <br className="hidden sm:block" />
              without the setup
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-theme-subtle">
              Write once, publish anywhere. Markdown-powered docs with wiki
              links, version history, and public hosting.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/login" className="btn-primary !px-8 !py-3 !text-base">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/docs" className="btn-secondary !px-8 !py-3 !text-base">
                View Docs
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-24 sm:py-32">
        <Container>
          <div className="mx-auto max-w-[800px]">
            <div className="text-center mb-16">
              <p className="eyebrow mb-4">How It Works</p>
              <h2 className="text-3xl font-bold tracking-tight text-theme-main sm:text-4xl lg:text-5xl">
                From code to docs in 3 steps
              </h2>
            </div>

            <div className="space-y-12">
              {/* Step 1 */}
              <div className="flex gap-5">
                <div className="flex-shrink-0 flex items-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-theme-accent text-sm font-bold text-white">
                    1
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-lg font-semibold text-theme-main">
                    Import your source code
                  </h3>
                  <p className="mt-2 text-sm text-theme-subtle">
                    Connect your repository and we&apos;ll extract structure from your
                    codebase automatically.
                  </p>

                  {/* Code card */}
                  <div className="mt-4 overflow-hidden rounded-xl border border-theme-border bg-[#0d0d14] p-5">
                    <pre className="text-sm leading-relaxed font-mono overflow-x-auto">
                      <code>
                        <span style={{ color: '#6b7280' }}>{'// Configure your docs source'}</span>
                        {'\n'}
                        <span style={{ color: '#f472b6' }}>import</span>
                        <span style={{ color: '#f0f0f5' }}>{' { '}</span>
                        <span style={{ color: '#67e8f9' }}>defineConfig</span>
                        <span style={{ color: '#f0f0f5' }}>{' } '}</span>
                        <span style={{ color: '#f472b6' }}>from</span>
                        <span style={{ color: '#a5b4fc' }}>{" 'tomebase'"}</span>
                        <span style={{ color: '#f0f0f5' }}>{';'}</span>
                        {'\n\n'}
                        <span style={{ color: '#f472b6' }}>export default</span>
                        <span style={{ color: '#67e8f9' }}>{' defineConfig'}</span>
                        <span style={{ color: '#f0f0f5' }}>{'({'}</span>
                        {'\n'}
                        <span style={{ color: '#f0f0f5' }}>{'  source: '}</span>
                        <span style={{ color: '#a5b4fc' }}>{'./docs'}</span>
                        <span style={{ color: '#f0f0f5' }}>{','}</span>
                        {'\n'}
                        <span style={{ color: '#f0f0f5' }}>{'  output: '}</span>
                        <span style={{ color: '#a5b4fc' }}>{"'public'"}</span>
                        <span style={{ color: '#f0f0f5' }}>{','}</span>
                        {'\n'}
                        <span style={{ color: '#f0f0f5' }}>{'  theme: '}</span>
                        <span style={{ color: '#a5b4fc' }}>{"'dark'"}</span>
                        <span style={{ color: '#f0f0f5' }}>{','}</span>
                        {'\n'}
                        <span style={{ color: '#f0f0f5' }}>{'  wikiLinks: '}</span>
                        <span style={{ color: '#f472b6' }}>true</span>
                        <span style={{ color: '#f0f0f5' }}>{','}</span>
                        {'\n'}
                        <span style={{ color: '#f0f0f5' }}>{'})'}</span>
                        <span style={{ color: '#f0f0f5' }}>{';'}</span>
                      </code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-5">
                <div className="flex-shrink-0 flex items-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-theme-accent text-sm font-bold text-white">
                    2
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-lg font-semibold text-theme-main">
                    Review &amp; enrich
                  </h3>
                  <p className="mt-2 text-sm text-theme-subtle">
                    Use the built-in Markdown editor to refine content, add wiki
                    links between pages, and organize your page tree.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-5">
                <div className="flex-shrink-0 flex items-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-theme-accent text-sm font-bold text-white">
                    3
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-lg font-semibold text-theme-main">
                    Publish instantly
                  </h3>
                  <p className="mt-2 text-sm text-theme-subtle">
                    Hit publish and your docs go live with SEO metadata, custom
                    domains, and a polished reading experience — zero config
                    required.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA row */}
            <div className="mt-14 flex items-center justify-center gap-4">
              <Link href="/login" className="btn-primary !px-6 !py-2.5 !text-sm">
                Try import now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/docs" className="btn-secondary !px-6 !py-2.5 !text-sm">
                See health dashboard
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 sm:py-32">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-theme-main sm:text-4xl lg:text-5xl">
              Everything you need
            </h2>
            <p className="mt-4 text-lg text-theme-subtle">
              Six features that make TomeBase the last docs platform your
              team needs.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card-hover group rounded-2xl border border-theme-border bg-theme-card p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent-light text-theme-accent">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-theme-main">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-theme-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── Stats ─── */}
      <section className="border-y border-theme-border bg-theme-card/40 py-16">
        <Container>
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-extrabold text-theme-main sm:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm font-medium text-theme-muted uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 sm:py-32">
        <Container>
          <div className="relative mx-auto max-w-2xl text-center overflow-hidden rounded-2xl border border-theme-border bg-theme-card px-8 py-20">
            <div className="hero-glow-secondary -left-20 -top-20" />
            <div className="hero-glow-secondary -right-20 -bottom-20" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-theme-main sm:text-4xl">
                Start building your docs today
              </h2>
              <div className="mt-8">
                <Link
                  href="/login"
                  className="btn-primary !px-8 !py-3 !text-base"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-theme-border py-12">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-theme-muted">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="logo-footer"
                    x1="0"
                    y1="0"
                    x2="32"
                    y2="32"
                  >
                    <stop offset="0%" stopColor="#3B3BFF" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
                <rect
                  width="32"
                  height="32"
                  rx="8"
                  fill="url(#logo-footer)"
                />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              TomeBase — Your knowledge base.
            </div>
            <div className="flex items-center gap-6 text-sm text-theme-muted">
              <Link
                href="/pricing"
                className="hover:text-theme-main transition-colors"
              >
                Pricing
              </Link>
              <span className="text-theme-border">·</span>
              <Link
                href="/roadmap"
                className="hover:text-theme-main transition-colors"
              >
                Roadmap
              </Link>
              <span className="text-theme-border">·</span>
              <Link
                href="https://github.com/bushninjadots/tomebase"
                className="hover:text-theme-main transition-colors"
              >
                GitHub
              </Link>
              <span className="text-theme-border">·</span>
              <Link
                href="/terms"
                className="hover:text-theme-main transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="hover:text-theme-main transition-colors"
              >
                Privacy
              </Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
