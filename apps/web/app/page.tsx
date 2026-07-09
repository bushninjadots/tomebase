import Link from 'next/link';
import { Container } from '@fluid/ui';
import {
  ArrowRight, BookOpen, Code2, GitBranch, Search, Sparkles,
  FileText, Users, Zap, Shield,
  Globe, Layers, Star, Github,
} from 'lucide-react';

const stats = [
  { value: '10,000+', label: 'Pages created' },
  { value: '500+', label: 'Active teams' },
  { value: '99.9%', label: 'Uptime' },
  { value: 'Open Source', label: 'MIT licensed' },
];

const testimonials = [
  {
    quote: 'Fluid replaced our three separate documentation tools. The auto-save and wiki links alone saved us hours every week.',
    author: 'Sarah Chen',
    role: 'Engineering Manager, Amplify Health',
  },
  {
    quote: 'We migrated our entire API docs from a static site generator in an afternoon. The OpenAPI importer is magic.',
    author: 'Marcus Rivera',
    role: 'Lead Developer, Stackform',
  },
  {
    quote: 'The graph view shows us exactly where our documentation has gaps. It\'s become an essential part of our docs review process.',
    author: 'Priya Patel',
    role: 'Technical Writer, Nexus Robotics',
  },
];

const features = [
  {
    icon: BookOpen,
    title: 'Documentation Editor',
    description: 'Full-featured Markdown editor with live preview, wiki links, auto-save, and version history. Organize pages in a hierarchical tree.',
  },
  {
    icon: GitBranch,
    title: 'Wiki Links & Graph',
    description: 'Connect docs with [[wiki links]]. Visualize your knowledge graph with a force-directed graph view. Find orphans and broken links instantly.',
  },
  {
    icon: Code2,
    title: 'Auto-Generate from Code',
    description: 'Import TypeScript/JavaScript files or OpenAPI specs. Fluid parses your source and generates clean Markdown documentation automatically.',
  },
  {
    icon: Search,
    title: 'Full-Text Search',
    description: 'Cmd+K search across all pages. Searches titles and content with contextual snippets. Tag-based filtering keeps results focused.',
  },
  {
    icon: Globe,
    title: 'Public Hosting',
    description: 'Publish docs with one toggle. Custom domains, SEO metadata, sitemaps, and a polished reading experience — no separate hosting needed.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite team members, assign admin or member roles, and collaborate in real-time. Free tier supports up to 3 members.',
  },
  {
    icon: Shield,
    title: 'API Keys & Automation',
    description: 'Generate scoped API keys for CI/CD pipelines. Import, export, and manage documentation programmatically.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered (Coming Soon)',
    description: 'Smart content suggestions, automated summaries, and AI-assisted writing to help you document faster.',
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    features: ['Up to 3 team members', 'Unlimited pages', 'Public docs hosting', 'Full-text search', 'Community support'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    features: ['Up to 15 team members', 'Custom domains', 'API key management', 'OpenAPI & code import', 'Email support'],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    features: ['Up to 100 team members', 'SSO/SAML', 'White-label domains', 'Audit logs', 'Priority support'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function Home() {
  return (
    <div className="gradient-bg">
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
              <Link href="/pricing" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Pricing</Link>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
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
              Documentation that{' '}
              <span className="gradient-text">writes itself</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
              Fluid generates beautiful docs from your code, keeps your team in sync,
              and publishes everything to the web — no build steps, no separate hosting.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800 transition-colors shadow-lg"
              >
                Start Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="https://github.com/anomalyco/fluid"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Github className="h-5 w-5" />
                Star on GitHub
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">No credit card required · 3 team members free forever</p>
          </div>
        </Container>
      </section>

      <section className="border-y border-gray-100 bg-white/50 py-12">
        <Container>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-gray-900 sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From zero to published docs in three steps.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fluid-50 text-fluid-600">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">1. Write or import</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Write Markdown with live preview, wiki links, and auto-save. Or import from TypeScript, JavaScript, or OpenAPI specs.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fluid-50 text-fluid-600">
                <Layers className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">2. Organize & connect</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Structure pages in a hierarchy, link them with [[Wiki Links]], and see the full picture in the graph view.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fluid-50 text-fluid-600">
                <Globe className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">3. Publish & share</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Toggle public publishing, invite your team, or use the API. Host on your own domain with Pro.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Eight features that make Fluid the easiest docs platform your team will ever use.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-fluid-200 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fluid-50 text-fluid-600 group-hover:bg-fluid-100 transition-colors">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-gray-50 py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Loved by engineering teams
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Here&apos;s what teams are saying about Fluid.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.author} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex gap-0.5 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-600">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 border-t border-gray-50 pt-4">
                  <div className="text-sm font-medium text-gray-900">{t.author}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple pricing, no surprises
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start free. Upgrade when you need more.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3 mx-auto max-w-4xl">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 transition-all ${
                  plan.highlighted
                    ? 'border-fluid-200 bg-white shadow-lg ring-1 ring-fluid-100 scale-105'
                    : 'border-gray-100 bg-white'
                }`}
              >
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0 text-fluid-500">
                        <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === 'Enterprise' ? '/contact' : '/login'}
                  className={`mt-8 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    plan.highlighted
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
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

      <section className="bg-gray-900 py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Start shipping better docs today
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              No credit card. No setup. Just better documentation in minutes.
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
              <Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
              <span className="text-gray-200">·</span>
              <Link href="/roadmap" className="hover:text-gray-900 transition-colors">Roadmap</Link>
              <span className="text-gray-200">·</span>
              <Link href="https://github.com/anomalyco/fluid" className="hover:text-gray-900 transition-colors">GitHub</Link>
              <span className="text-gray-200">·</span>
              <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
