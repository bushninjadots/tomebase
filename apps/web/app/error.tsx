'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-page">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-red-400">500</h1>
        <h2 className="mt-4 text-lg font-semibold text-theme-main">Something went wrong</h2>
        <p className="mt-2 text-sm text-theme-subtle max-w-md">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-8 inline-flex items-center gap-2 btn-primary"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
