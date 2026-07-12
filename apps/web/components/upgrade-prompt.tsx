'use client';

import { useState } from 'react';
import { ArrowRight, Zap } from 'lucide-react';

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
    <div className="rounded-xl border border-theme-accent/20 bg-gradient-to-r from-theme-accent/5 to-theme-accent/[0.02] p-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-theme-accent/10">
          <Zap className="h-4 w-4 text-theme-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-theme-main">
            Unlock unlimited projects, custom domains, and team collaboration
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Upgrade'}
            {!loading && <ArrowRight className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}
