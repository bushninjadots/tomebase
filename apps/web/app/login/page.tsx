import { auth, signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LoginForm } from './form';

export const dynamic = 'force-dynamic';

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
        disabled={!process.env.AUTH_GITHUB_ID}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-theme-border bg-theme-card px-6 py-3 text-sm font-medium text-theme-subtle transition-all hover:bg-theme-hover hover:border-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
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
        disabled={!process.env.AUTH_GOOGLE_ID}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-theme-border bg-theme-card px-6 py-3 text-sm font-medium text-theme-subtle transition-all hover:bg-theme-hover hover:border-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>
    </form>
  );
}

export default async function LoginPage() {
  let session = null;
  try {
    session = await auth();
  } catch (e) {
    console.error('Auth session check failed:', e);
  }
  if (session?.user) redirect('/dashboard');

  const hasOAuth = !!(process.env.AUTH_GITHUB_ID || process.env.AUTH_GOOGLE_ID);

  return (
    <div className="bg-theme-page flex min-h-screen items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="hero-glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-theme-border bg-theme-card p-8 shadow-2xl shadow-black/40">
          <div className="mb-8 text-center">
            <Link href="/" className="mb-6 inline-flex items-center justify-center">
              <svg viewBox="0 0 32 32" fill="none" className="h-10 w-10" aria-hidden="true">
                <defs>
                  <linearGradient id="logo-login" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#logo-login)" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-theme-main">Sign in to TomeBase</h1>
            <p className="mt-2 text-sm text-theme-muted">Welcome back — let&apos;s keep building.</p>
          </div>

          <LoginForm />

          {hasOAuth && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-theme-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-theme-card px-3 text-theme-muted">or</span>
                </div>
              </div>
              <div className="space-y-3">
                {process.env.AUTH_GITHUB_ID && <GitHubButton />}
                {process.env.AUTH_GOOGLE_ID && <GoogleButton />}
              </div>
            </>
          )}
        </div>

          <p className="mt-6 text-center text-xs text-theme-muted">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-theme-accent hover:text-theme-accent-hover transition-colors">
              Sign up
            </Link>
          </p>
      </div>
    </div>
  );
}
