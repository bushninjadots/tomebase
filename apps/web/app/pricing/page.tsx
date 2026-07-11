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
    <div className="min-h-screen bg-theme-page">
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
              className={`relative rounded-2xl border bg-theme-card p-8 transition-all hover:shadow-lg card-hover ${
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
              <ul className="mb-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-theme-subtle">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-theme-accent" />
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
              <div key={item.q} className="rounded-2xl border border-theme-border bg-theme-card p-6">
                <h3 className="text-sm font-semibold text-theme-main">{item.q}</h3>
                <p className="mt-2 text-sm text-theme-subtle leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <footer className="border-t border-theme-border py-12">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-theme-muted">
              <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5">
                <rect width="32" height="32" rx="8" fill="#3B3BFF" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              TomeBase — Your knowledge base.
            </div>
            <div className="flex items-center gap-6 text-sm text-theme-muted">
              <Link href="/features" className="hover:text-theme-main transition-colors">Features</Link>
              <span className="text-theme-border">&middot;</span>
              <Link href="/pricing" className="hover:text-theme-main transition-colors">Pricing</Link>
              <span className="text-theme-border">&middot;</span>
              <Link href="/roadmap" className="hover:text-theme-main transition-colors">Roadmap</Link>
              <span className="text-theme-border">&middot;</span>
              <Link href="https://github.com/bushninjadots/tomebase" className="hover:text-theme-main transition-colors">GitHub</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
