import { auth, signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LoginForm } from './form';

function GitHubButton() {
  return (
    <form
      action={async () => {
        'use server';
        const gh = process.env.AUTH_GITHUB_ID ? 'github' : null;
        if (gh) await signIn(gh, { redirectTo: '/dashboard' });
      }}
    >
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-theme-border bg-white px-6 py-3 text-sm font-medium text-theme-subtle shadow-sm transition-all hover:border-theme-border hover:bg-theme-hover hover:shadow disabled:opacity-50"
        disabled={!process.env.AUTH_GITHUB_ID}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        Continue with GitHub
      </button>
    </form>
  );
}

function GoogleButton() {
  return (
    <form
      action={async () => {
        'use server';
        const gl = process.env.AUTH_GOOGLE_ID ? 'google' : null;
        if (gl) await signIn(gl, { redirectTo: '/dashboard' });
      }}
    >
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-theme-border bg-white px-6 py-3 text-sm font-medium text-theme-subtle shadow-sm transition-all hover:border-theme-border hover:bg-theme-hover hover:shadow disabled:opacity-50"
        disabled={!process.env.AUTH_GOOGLE_ID}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        </svg>
        Continue with Google
      </button>
    </form>
  );
}

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  const hasOAuth = !!(process.env.AUTH_GITHUB_ID || process.env.AUTH_GOOGLE_ID);

  return (
    <div className="gradient-bg flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-sm w-full px-4">
        <div className="rounded-2xl border border-theme-border bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <Link href="/" className="mb-6 inline-flex items-center gap-2">
              <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8" aria-hidden="true">
                <defs>
                  <linearGradient id="logo-login" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#0c8ee7" />
                    <stop offset="100%" stopColor="#7cc8fb" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#logo-login)" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-theme-main">Welcome to TomeBase</h1>
            <p className="mt-2 text-sm text-theme-subtle">Sign in to start documenting</p>
          </div>

          <LoginForm />

          {hasOAuth && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-theme-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-theme-muted">or continue with</span>
                </div>
              </div>
              <div className="space-y-3">
                {process.env.AUTH_GITHUB_ID && <GitHubButton />}
                {process.env.AUTH_GOOGLE_ID && <GoogleButton />}
              </div>
            </>
          )}

          <p className="mt-6 text-center text-xs text-theme-muted">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-theme-subtle">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-theme-subtle">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
