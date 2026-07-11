'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Plan {
  name: string;
  price: string;
  period?: string;
  cta: string;
  popular: boolean;
  tier: 'free' | 'pro';
}

export function PricingButtons({ plan }: { plan: Plan }) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (plan.tier === 'free') {
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: 'pro' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      window.location.href = '/login';
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        plan.popular
          ? 'bg-theme-main text-white hover:opacity-90'
          : 'border border-theme-border text-theme-subtle hover:border-theme-border hover:bg-theme-hover'
      }`}
    >
      {loading ? 'Redirecting...' : plan.cta}
      {!loading && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}
