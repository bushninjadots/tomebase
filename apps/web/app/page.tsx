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
  Check,
  ChevronDown,
} from 'lucide-react';
import { MarketingNav } from '@/components/marketing-nav';
import { InteractiveDemo } from '@/components/interactive-demo';

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
    title: 'Code Import',
    description:
      'Import TypeScript, JavaScript, Python, Go, and Rust code. Auto-generate docs from JSDoc, docstrings, and doc comments.',
  },
];

const plans = [
  {
    name: 'Free',
    price: '€0',
    period: '/month',
    description: 'For students, hobbyists, and developers evaluating TomeBase.',
    features: [
      '1 project',
      'Unlimited documentation pages',
      'Markdown editor with live preview',
      'Wiki Links & Backlinks',
      'Graph View',
      'Documentation publishing',
      'TomeBase subdomain',
      'Community support',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '€15',
    period: '/month',
    description: 'For indie developers, freelancers, startups, and engineering teams.',
    features: [
      'Unlimited projects',
      'Unlimited documentation pages',
      'Private documentation',
      'Custom domains',
      'Remove TomeBase branding',
      'Team collaboration',
      'Unlimited collaborators',
      'Version history',
      'Documentation analytics',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
];

const faq = [
  { q: 'Can I upgrade from Free to Pro later?', a: 'Yes. You can upgrade at any time. Your data and pages are preserved.' },
  { q: 'What payment methods do you accept?', a: 'Stripe-powered billing with credit/debit card support.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your dashboard settings anytime. You keep access until the end of your billing period.' },
  { q: 'Does the Free plan feel limited?', a: 'No. The Free plan includes unlimited pages, the full editor, wiki links, graph view, search, and public hosting.' },
  { q: 'What languages does code import support?', a: 'TypeScript, JavaScript, Python, Go, Rust, and OpenAPI specs.' },
  { q: 'How does the health score work?', a: 'TomeBase analyzes link quality, content freshness, structure, and engagement to give each page a score out of 100.' },
];

const stats = [
  { value: 'Free', label: 'Forever for solo devs' },
  { value: 'Open Source', label: 'MIT licensed on GitHub' },
  { value: '5', label: 'Languages supported' },
  { value: '5 min', label: 'To your first docs page' },
];

export default function Home() {
  return (
    <div className="bg-theme-page">
      <MarketingNav />

      {/* ─── Hero ─── */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E1020] via-[#12142a] to-[#0d0d14]" />

        {/* Glow effects */}
        <div className="hero-glow -left-40 -top-40" />
        <div className="hero-glow -right-40 -bottom-40" />

        <div className="relative z-10 w-full">
          <Container>
            <div className="mx-auto max-w-4xl text-center pt-24 pb-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 mb-8">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-medium text-theme-subtle">Now in open beta — free forever for solo devs</span>
              </div>

              <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Documentation that{' '}
                <span className="gradient-text">writes itself</span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/60">
                Generate beautiful docs from your code, keep your team in sync,
                and publish to the web — no build steps, no separate hosting.
              </p>

              <div className="mt-10 flex items-center justify-center gap-4">
                <a href="#try-tomebase" className="inline-flex items-center gap-2.5 rounded-xl bg-theme-accent px-8 py-3.5 text-base font-bold text-white shadow-[0_4px_20px_rgba(229,165,11,0.45)] transition-all hover:bg-theme-accent-hover hover:shadow-[0_6px_28px_rgba(229,165,11,0.55)]">
                  Try it now
                  <ArrowRight className="h-5 w-5" />
                </a>
                <Link href="/docs" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/15">
                  View Docs
                </Link>
              </div>

              <p className="mt-5 text-xs text-white/35">
                No credit card required · Open source · TypeScript, Python, Go & Rust
              </p>
            </div>

            {/* App preview card */}
            <div className="mx-auto max-w-3xl mb-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-1 shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
                <div className="rounded-xl bg-[#16181D] p-5 flex gap-4">
                  {/* Mini sidebar */}
                  <div className="w-40 shrink-0 hidden sm:block">
                    {['Overview', 'Getting Started', 'Troubleshooting', 'calculateTotal', 'User', 'SubscriptionTier'].map((p, i) => (
                      <div
                        key={p}
                        className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11.5px] mb-0.5 ${
                          i === 0
                            ? 'bg-accent/20 text-accent font-semibold'
                            : 'text-[#5A6070] font-normal'
                        }`}
                      >
                        <span className="opacity-50 text-[10px]">▣</span>
                        {p}
                      </div>
                    ))}
                  </div>
                  {/* Mini doc */}
                  <div className="flex-1 border-l border-white/[0.08] pl-5 hidden sm:block">
                    <div className="font-mono text-base font-bold text-[#E2E8F0] mb-2">Overview</div>
                    <div className="text-[11.5px] text-[#5A6070] mb-3">
                      Product overview · Score: <span className="text-amber-400 font-semibold">81</span>
                    </div>
                    <div className="rounded-lg bg-[#0D1117] p-3 font-mono text-[11px] leading-relaxed">
                      <div className="text-[#8b949e]">{`/**`}</div>
                      <div className="text-[#8b949e]">{` * TomeBase API Reference`}</div>
                      <div className="text-[#8b949e]">{` */`}</div>
                      <div className="mt-1.5">
                        <span className="text-[#ff7b72]">export</span>
                        <span className="text-[#c9d1d9]"> interface </span>
                        <span className="text-[#7ee787]">User</span>
                        <span className="text-[#c9d1d9]">{` {`}</span>
                      </div>
                      <div className="pl-3.5 text-[#79c0ff]">
                        id<span className="text-[#c9d1d9]">: string</span>
                      </div>
                      <div className="pl-3.5 text-[#79c0ff]">
                        email<span className="text-[#c9d1d9]">: string</span>
                      </div>
                      <div className="text-[#c9d1d9]">{`}`}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* ─── Interactive Demo ─── */}
      <InteractiveDemo />

      {/* ─── Stats ─── */}
      <section className="border-y border-theme-border bg-theme-page py-0">
        <Container>
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {stats.map((stat, i) => (
              <div key={stat.label} className={`text-center py-8 px-6 ${i < stats.length - 1 ? 'sm:border-r border-theme-border' : ''}`}>
                <div className="text-xl font-extrabold text-theme-accent mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-theme-subtle">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow mb-4">Features</p>
            <h2 className="text-3xl font-bold tracking-tight text-theme-main sm:text-4xl lg:text-5xl">
              Everything your docs need
            </h2>
            <p className="mt-4 text-lg text-theme-subtle">
              From import to publish in minutes. TomeBase handles the hard parts
              so you can focus on writing great code.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

          <div className="mt-10 text-center">
            <Link href="/features" className="inline-flex items-center gap-2 rounded-xl border border-theme-border bg-theme-card px-6 py-3 text-sm font-semibold text-theme-main transition-all hover:border-theme-accent/30 hover:bg-theme-hover">
              Explore all features
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="border-t border-theme-border bg-theme-card/40 py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-[800px]">
            <div className="text-center mb-14">
              <p className="eyebrow mb-4">How It Works</p>
              <h2 className="text-3xl font-bold tracking-tight text-theme-main sm:text-4xl lg:text-5xl">
                From code to docs in 3 steps
              </h2>
            </div>

            <div className="space-y-10">
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
                    Paste TypeScript, JavaScript, Python, Go, or Rust code with doc comments.
                    TomeBase parses types, signatures, and descriptions automatically.
                  </p>
                  <div className="mt-4 overflow-hidden rounded-xl border border-theme-border bg-[#0d0d14] p-5">
                    <pre className="text-sm leading-relaxed font-mono overflow-x-auto">
                      <code>
                        <span style={{ color: '#8b949e' }}>{'/**'}</span>
                        {'\n'}
                        <span style={{ color: '#8b949e' }}>{' * Creates a new user account.'}</span>
                        {'\n'}
                        <span style={{ color: '#8b949e' }}>{' * @param email - User email address'}</span>
                        {'\n'}
                        <span style={{ color: '#8b949e' }}>{' * @param role - Access level'}</span>
                        {'\n'}
                        <span style={{ color: '#8b949e' }}>{' */'}</span>
                        {'\n'}
                        <span style={{ color: '#ff7b72' }}>export async function </span>
                        <span style={{ color: '#d2a8ff' }}>createUser</span>
                        <span style={{ color: '#c9d1d9' }}>(</span>
                        {'\n'}
                        <span style={{ color: '#c9d1d9' }}>{'  email: '}</span>
                        <span style={{ color: '#79c0ff' }}>string</span>
                        <span style={{ color: '#c9d1d9' }}>,</span>
                        {'\n'}
                        <span style={{ color: '#c9d1d9' }}>{'  role: '}</span>
                        <span style={{ color: '#79c0ff' }}>Role</span>
                        {'\n'}
                        <span style={{ color: '#c9d1d9' }}>): </span>
                        <span style={{ color: '#79c0ff' }}>Promise</span>
                        <span style={{ color: '#c9d1d9' }}>{'<'}</span>
                        <span style={{ color: '#7ee787' }}>User</span>
                        <span style={{ color: '#c9d1d9' }}>{'>'}</span>
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
                    TomeBase generates a documentation page for each function, interface, and type.
                    Add examples, descriptions, and cross-links in the editor.
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
                    Hit publish and your docs go live with SEO metadata, custom domains,
                    and a polished reading experience — zero config required.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex items-center justify-center gap-4">
              <a href="#try-tomebase" className="inline-flex items-center gap-2 rounded-xl bg-theme-accent px-7 py-3 text-sm font-bold text-white shadow-[0_2px_12px_rgba(229,165,11,0.3)] transition-all hover:bg-theme-accent-hover">
                Try import now
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/docs" className="inline-flex items-center gap-2 rounded-xl border border-theme-border px-7 py-3 text-sm font-semibold text-theme-main transition-all hover:bg-theme-hover">
                See health dashboard
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-14">
            <p className="eyebrow mb-4">Pricing</p>
            <h2 className="text-3xl font-bold tracking-tight text-theme-main sm:text-4xl lg:text-5xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-theme-subtle">
              Start for free. Upgrade only when you need more.
            </p>
          </div>

          <div className="mx-auto grid max-w-3xl gap-8 lg:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border bg-theme-card p-8 transition-all card-hover ${
                  plan.popular
                    ? 'border-theme-accent ring-1 ring-theme-accent/20'
                    : 'border-theme-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-theme-accent px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-theme-main">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-theme-main">{plan.price}</span>
                    {plan.period && <span className="text-sm text-theme-muted">{plan.period}</span>}
                  </div>
                  <p className="mt-2 text-sm text-theme-subtle">{plan.description}</p>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-theme-subtle">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-theme-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                    plan.popular
                      ? 'bg-theme-accent text-white shadow-[0_2px_12px_rgba(229,165,11,0.3)] hover:bg-theme-accent-hover'
                      : 'border border-theme-border bg-theme-card text-theme-main hover:bg-theme-hover'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="border-t border-theme-border bg-theme-card/40 py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-14">
              <p className="eyebrow mb-4">FAQ</p>
              <h2 className="text-3xl font-bold tracking-tight text-theme-main sm:text-4xl">
                Frequently asked questions
              </h2>
            </div>
            <div className="space-y-4">
              {faq.map((item) => (
                <details key={item.q} className="group rounded-2xl border border-theme-border bg-theme-card">
                  <summary className="flex cursor-pointer items-center justify-between p-6 text-sm font-semibold text-theme-main list-none">
                    {item.q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-theme-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-6 pb-6 -mt-2">
                    <p className="text-sm text-theme-subtle leading-relaxed">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 sm:py-24">
        <Container>
          <div className="relative mx-auto max-w-2xl text-center overflow-hidden rounded-2xl border border-theme-border bg-theme-card px-8 py-20">
            <div className="hero-glow-secondary -left-20 -top-20" />
            <div className="hero-glow-secondary -right-20 -bottom-20" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-theme-main sm:text-4xl">
                Start building your docs today
              </h2>
              <p className="mt-4 text-theme-subtle">
                Join hundreds of developer teams who ship better docs faster.
              </p>
              <div className="mt-8 flex items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2.5 rounded-xl bg-theme-accent px-8 py-3.5 text-base font-bold text-white shadow-[0_4px_20px_rgba(229,165,11,0.4)] transition-all hover:bg-theme-accent-hover hover:shadow-[0_6px_28px_rgba(229,165,11,0.5)]"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 rounded-xl border border-theme-border px-8 py-3.5 text-base font-semibold text-theme-main transition-all hover:bg-theme-hover"
                >
                  View live demo
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-theme-border py-12">
        <Container>
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-theme-muted">
              <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5" aria-hidden="true">
                <defs>
                  <linearGradient id="logo-footer" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#3B3BFF" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#logo-footer)" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              <span className="font-semibold text-theme-subtle">TomeBase</span>
              <span className="text-theme-muted">© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-theme-muted">
              <Link href="/features" className="hover:text-theme-main transition-colors">Features</Link>
              <Link href="/pricing" className="hover:text-theme-main transition-colors">Pricing</Link>
              <Link href="/roadmap" className="hover:text-theme-main transition-colors">Roadmap</Link>
              <Link href="/docs" className="hover:text-theme-main transition-colors">Docs</Link>
              <Link href="/contact" className="hover:text-theme-main transition-colors">Contact</Link>
              <Link href="https://github.com/bushninjadots/tomebase" className="hover:text-theme-main transition-colors">GitHub</Link>
              <Link href="/terms" className="hover:text-theme-main transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-theme-main transition-colors">Privacy</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
