import { Container } from '@fluid/ui';
import Link from 'next/link';
import { Check, ArrowRight, Info } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'For solo developers and small projects. Everything you need to start documenting.',
    features: [
      '1 project',
      '50 pages per project',
      '3 team members',
      'Full Markdown editor with live preview',
      'Wiki links & backlinks',
      'Graph view',
      'Cmd+K search',
      'Public docs hosting',
      'Code generation (TS/JS)',
      'API key management',
      'Email/password or OAuth login',
    ],
    note: 'No credit card required.',
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For growing teams that need more projects, pages, and members.',
    features: [
      '10 projects',
      '500 pages per project',
      '15 team members',
      'Everything in Free',
      'Custom domain support',
      'Priority support',
      'Advanced analytics',
      'API access (higher rate limits)',
    ],
    note: 'Stripe billing coming soon.',
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For organizations that need maximum scale, control, and support.',
    features: [
      '100 projects',
      '10,000 pages per project',
      'Unlimited team members',
      'Everything in Pro',
      'SSO / SAML',
      'Audit logs',
      'Role-based access control',
      'Dedicated support & SLA',
      'Self-hosted option',
      'Custom integrations',
    ],
    note: 'Contact us for a tailored quote.',
    cta: 'Contact Sales',
    popular: false,
  },
];

const faq = [
  { q: 'Can I upgrade from Free to Pro later?', a: 'Yes. You can upgrade at any time. Your data and pages are preserved.' },
  { q: 'Is there a free trial for Pro?', a: 'Yes — start a 14-day free trial with no credit card required.' },
  { q: 'What payment methods do you accept?', a: 'Stripe-powered billing with credit/debit card support.' },
  { q: 'Can I self-host Enterprise?', a: 'Yes, Enterprise plans include a self-hosted option for full data control.' },
];

export default function PricingPage() {
  return (
    <div className="gradient-bg min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/70 backdrop-blur-xl">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
                <rect width="32" height="32" rx="8" fill="#0c8ee7" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              <span className="font-bold tracking-tight">Fluid</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Features</Link>
              <Link
                href="/login"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </Container>
      </nav>

      <Container className="py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Simple, transparent <span className="gradient-text">pricing</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Start for free. Upgrade when you need more projects, pages, or team members.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border bg-white p-8 transition-all hover:shadow-lg ${
                plan.popular
                  ? 'border-fluid-200 shadow-md ring-1 ring-fluid-100'
                  : 'border-gray-100 shadow-sm'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-fluid-600 px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-sm text-gray-500">{plan.period}</span>}
                </div>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
              </div>
              <ul className="mb-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-fluid-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.note && (
                <p className="mb-6 flex items-start gap-2 text-xs text-gray-400">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  {plan.note}
                </p>
              )}
              <Link
                href="/login"
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  plan.popular
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

        <div className="mx-auto mt-24 max-w-2xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-6">
            {faq.map((item) => (
              <div key={item.q}>
                <h3 className="text-sm font-semibold text-gray-900">{item.q}</h3>
                <p className="mt-1 text-sm text-gray-500">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <footer className="border-t border-gray-100 bg-white py-12">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-sm text-gray-500">
              Fluid — Knowledge that flows into action.
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
