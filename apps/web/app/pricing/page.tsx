import { Container } from '@fluid/ui';
import Link from 'next/link';
import { Check, ArrowRight, Info } from 'lucide-react';
import { PricingButtons } from './buttons';

const plans = [
  {
    name: 'Free',
    price: '\u20AC0',
    period: '/month',
    description: 'For students, hobbyists, and developers evaluating TomeBase. Build and publish complete documentation.',
    features: [
      '1 project',
      'Unlimited documentation pages',
      'Markdown editor with live preview',
      'Auto-save',
      'Wiki Links & Backlinks',
      'Graph View',
      'Search (Cmd+K)',
      'Documentation publishing',
      'TomeBase subdomain (project.tomebase.app)',
      'Basic themes',
      'Community support',
    ],
    note: 'No credit card required.',
    cta: 'Start Free',
    popular: false,
    tier: 'free' as const,
  },
  {
    name: 'Pro',
    price: '\u20AC15',
    period: '/month',
    description: 'For indie developers, freelancers, startups, and engineering teams who need more.',
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
      'API access',
      'Priority email support',
      'Early access to new features',
    ],
    note: 'Cancel anytime.',
    cta: 'Upgrade to Pro',
    popular: true,
    tier: 'pro' as const,
  },
];

const faq = [
  { q: 'Can I upgrade from Free to Pro later?', a: 'Yes. You can upgrade at any time. Your data and pages are preserved.' },
  { q: 'What payment methods do you accept?', a: 'Stripe-powered billing with credit/debit card support.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your dashboard settings anytime. You keep access until the end of your billing period.' },
  { q: 'Does the Free plan feel limited?', a: 'No. The Free plan includes unlimited pages, the full editor, wiki links, graph view, search, and public hosting. You only upgrade when you need multiple projects, private docs, or custom domains.' },
];

export default function PricingPage() {
  return (
    <div className="gradient-bg min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-theme-border/80 bg-white/70 backdrop-blur-xl">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
                <rect width="32" height="32" rx="8" fill="#0c8ee7" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              <span className="font-bold tracking-tight dark:text-white">TomeBase</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/features" className="text-sm text-theme-muted hover:text-theme-main transition-colors">Features</Link>
              <Link
                href="/login"
                className="rounded-lg bg-theme-main px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </Container>
      </nav>

      <Container className="py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-theme-main sm:text-5xl">
            Simple, transparent <span className="gradient-text">pricing</span>
          </h1>
          <p className="mt-4 text-lg text-theme-subtle">
            Start for free. Upgrade only when you need private docs, custom domains, or team collaboration.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border bg-white p-8 transition-all hover:shadow-lg ${
                plan.popular
                  ? 'border-fluid-200 shadow-md ring-1 ring-fluid-100 dark:border-fluid-700 dark:ring-fluid-800'
                  : 'border-theme-border shadow-sm'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-fluid-600 px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-theme-main">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-theme-main">{plan.price}</span>
                  {plan.period && <span className="text-sm text-theme-muted">{plan.period}</span>}
                </div>
                <p className="mt-2 text-sm text-theme-muted">{plan.description}</p>
              </div>
              <ul className="mb-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-theme-subtle">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-fluid-600 dark:text-fluid-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.note && (
                <p className="mb-6 flex items-start gap-2 text-xs text-theme-muted">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  {plan.note}
                </p>
              )}
              <PricingButtons plan={plan} />
            </div>
          ))}
        </div>

        <div className="mx-auto mt-24 max-w-2xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-theme-main">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-6">
            {faq.map((item) => (
              <div key={item.q}>
                <h3 className="text-sm font-semibold text-theme-main">{item.q}</h3>
                <p className="mt-1 text-sm text-theme-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <footer className="border-t border-theme-border bg-white py-12">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-sm text-theme-muted">
              TomeBase — Your knowledge base.
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
