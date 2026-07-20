'use client';

import { Component, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const Spirit = dynamic(
  () => import('./spirit').then((mod) => ({ default: mod.Spirit })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 9999,
          width: 48,
          height: 48,
          borderRadius: 16,
          background: 'var(--color-theme-card, #fff)',
          border: '2px solid var(--color-theme-accent, #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'spirit-pulse 2s ease-in-out infinite',
        }}
      >
        <svg width="24" height="28" viewBox="0 0 120 144" fill="none">
          <path
            d="M60 10C80 10 108 34 108 66C108 90 103 106 103 106C103 106 88 90 72 106L72 90C64 106 56 106 48 90L48 106C32 90 17 106 17 106C17 106 12 90 12 66C12 34 40 10 60 10Z"
            fill="var(--color-theme-accent, #6366f1)"
            opacity="0.6"
          />
          <circle cx="46" cy="60" r="4" fill="white" />
          <circle cx="74" cy="60" r="4" fill="white" />
        </svg>
      </div>
    ),
  },
);

class SpiritErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string | null }
> {
  override state = { hasError: false, error: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  static componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Spirit] Failed to render:', error.message, errorInfo.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            zIndex: 9999,
            padding: '8px 12px',
            borderRadius: 12,
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#dc2626',
            fontSize: 11,
            maxWidth: 200,
            cursor: 'pointer',
          }}
          onClick={() => this.setState({ hasError: false, error: null })}
          title="Click to retry"
        >
          Spirit failed to load. Click to retry.
          <br />
          <span style={{ fontSize: 9, opacity: 0.7 }}>{this.state.error}</span>
        </div>
      );
    }
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
          console.log('[Spirit] Was hidden in localStorage, resetting to floating');
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
