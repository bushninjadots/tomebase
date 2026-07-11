'use client';

import { useState } from 'react';
import { Link2, Check } from 'lucide-react';

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="rounded-lg p-1.5 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
      title="Copy page link"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
    </button>
  );
}
