'use client';

import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function UpgradePrompt() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
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
      window.location.href = '/pricing';
    }
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-theme-accent/20 bg-theme-accent/5 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-theme-accent/10">
          <Sparkles className="h-5 w-5 text-theme-accent" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-theme-main">Upgrade to Pro</h3>
          <p className="mt-1 text-xs text-theme-subtle">
            Unlimited projects, custom domains, team collaboration, and priority support.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3.5 py-1.5 text-xs font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors disabled:opacity-50"
            >
              {loading ? 'Redirecting...' : 'Upgrade — €15/mo'}
              {!loading && <ArrowRight className="h-3 w-3" />}
            </button>
            <Link href="/pricing" className="text-xs font-medium text-theme-muted hover:text-theme-accent transition-colors">
              Compare plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
