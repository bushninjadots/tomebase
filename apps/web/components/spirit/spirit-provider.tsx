'use client';

import { Component, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

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
    console.error('[Spirit] Render error:', error.message, errorInfo.componentStack);
  }

  override render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function EnsureFloating() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tome-spirit');
      if (raw) {
        const data = JSON.parse(raw);
        const state = data?.state;
        if (state?.mode === 'hidden') {
          state.mode = 'floating';
          localStorage.setItem('tome-spirit', JSON.stringify(data));
          window.location.reload();
        }
      }
    } catch {
      // ignore
    }
  }, []);
  return null;
}

export function SpiritProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SpiritErrorBoundary>
        <EnsureFloating />
        <Spirit />
      </SpiritErrorBoundary>
    </>
  );
}
