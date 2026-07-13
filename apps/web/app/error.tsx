'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ErrorBoundary]', error.message, error.stack);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-theme-page" role="alert">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-red-400">500</h1>
        <h2 className="mt-4 text-lg font-semibold text-theme-main">Something went wrong</h2>
        <p className="mt-2 text-sm text-theme-subtle max-w-md">
          {error.digest ? `Error ${error.digest}` : 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          aria-label="Try loading the page again"
          className="mt-8 inline-flex items-center gap-2 btn-primary"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
