'use client';

import dynamic from 'next/dynamic';

const Spirit = dynamic(
  () => import('./spirit').then((mod) => ({ default: mod.Spirit })),
  { ssr: false },
);

export function SpiritProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Spirit />
    </>
  );
}
