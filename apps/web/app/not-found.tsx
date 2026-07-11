import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-page">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-theme-accent">404</h1>
        <h2 className="mt-4 text-lg font-semibold text-theme-main">Page not found</h2>
        <p className="mt-2 text-sm text-theme-subtle max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 btn-primary"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
