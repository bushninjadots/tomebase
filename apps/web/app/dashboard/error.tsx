'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-page p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-theme-main mb-2">Something went wrong</h2>
        <p className="text-sm text-theme-subtle mb-6">
          The dashboard encountered an unexpected error. Your data is safe.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-theme-accent px-4 py-2.5 text-sm font-semibold text-gray-900 hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
