'use client';

import { Component, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

const Spirit = dynamic(
  () => import('./spirit').then((mod) => ({ default: mod.Spirit })),
  { ssr: false },
);

class SpiritErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: Error) {
    console.error('[Spirit] Failed to render:', error.message);
  }

  override render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function SpiritProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SpiritErrorBoundary>
        <Spirit />
      </SpiritErrorBoundary>
    </>
  );
}
