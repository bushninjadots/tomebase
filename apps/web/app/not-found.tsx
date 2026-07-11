import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-page">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-theme-muted">404</h1>
        <h2 className="mt-4 text-lg font-semibold text-theme-main">Page not found</h2>
        <p className="mt-2 text-sm text-theme-subtle">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-theme-main px-4 py-2 text-sm font-medium text-theme-page hover:opacity-90 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
