import Link from 'next/link';
import { Container } from '@fluid/ui';
import { ArrowRight, BookOpen, Code2, GitBranch, Search, Sparkles } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Auto-Generated Docs',
    description: 'Beautiful API documentation generated from your codebase. Keep docs in sync without the manual effort.',
  },
  {
    icon: GitBranch,
    title: 'Version Control',
    description: 'Every change is tracked. Compare versions, roll back, and maintain docs across API versions.',
  },
  {
    icon: Code2,
    title: 'Developer-First',
    description: 'MDX support, version control, and API playgrounds built for how developers actually work.',
  },
  {
    icon: Sparkles,
    title: 'AI Chat',
    description: 'Ask questions about your documentation and get answers. On the roadmap — coming when the product is ready.',
  },
  {
    icon: Search,
    title: 'Smart Search',
    description: 'Full-text search across all your documentation. Find exactly what you need, when you need it.',
  },
];

const stats = [
  { label: 'Docs Auto-Generated', value: '10K+' },
  { label: 'Active Teams', value: '500+' },
  { label: 'API Calls Served', value: '1M+' },
  { label: 'Uptime', value: '99.9%' },
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
            <div className="flex items-center gap-4">
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
                href="/docs"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                View Demo
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">No credit card required · Free tier included</p>
          </div>
        </Container>
      </section>

      {/* Stats */}
      <Container>
        <div className="grid grid-cols-2 gap-8 border-y border-gray-100 py-12 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </Container>

      {/* Features */}
      <section className="py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything your team needs to document
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From auto-generated API references to AI-powered search — Fluid keeps your documentation flowing.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-fluid-200 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-fluid-50 text-fluid-600 group-hover:bg-fluid-100 transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.description}</p>
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
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
