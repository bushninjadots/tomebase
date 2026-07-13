'use client';

import dynamic from 'next/dynamic';

const InteractiveDemo = dynamic(
  () => import('@/components/interactive-demo').then((m) => ({ default: m.InteractiveDemo })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] animate-pulse rounded-2xl bg-theme-card" />
    ),
  }
);

export function InteractiveDemoLazy() {
  return <InteractiveDemo />;
}
