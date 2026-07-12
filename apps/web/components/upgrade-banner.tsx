'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, X } from 'lucide-react';

export function UpgradeBanner() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-400">Welcome to Pro!</p>
          <p className="text-xs text-theme-subtle">Your upgrade is active. You now have unlimited projects, custom domains, and more.</p>
        </div>
      </div>
      <button onClick={() => setVisible(false)} className="text-theme-muted hover:text-theme-main transition-colors shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
