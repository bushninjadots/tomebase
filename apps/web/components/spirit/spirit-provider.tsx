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

  static componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Spirit] Failed to render:', error.message, errorInfo.componentStack);
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
