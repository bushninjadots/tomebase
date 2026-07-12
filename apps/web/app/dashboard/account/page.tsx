import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AccountDangerZone } from '@/components/account-danger-zone';

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      _count: {
        select: {
          projects: true,
          teams: true,
        },
      },
    },
  });

  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-theme-page">
      <Container className="py-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-theme-muted hover:text-theme-main transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-theme-main">Account Settings</h1>
          <p className="mt-2 text-sm text-theme-subtle">
            Manage your account profile and preferences.
          </p>

          <div className="mt-8 space-y-8">
            <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
              <h2 className="text-lg font-semibold text-theme-main">Profile</h2>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#E5A50B] to-[#ca8a04] flex items-center justify-center text-lg font-bold text-gray-900 shrink-0">
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-theme-main">{user.name || 'Unnamed User'}</div>
                    <div className="text-xs text-theme-muted">{user.email}</div>
                    <div className="text-xs text-theme-muted mt-0.5">
                      Member since {user.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-theme-border bg-theme-page p-4">
                    <div className="text-2xl font-bold text-theme-main">{user._count.projects}</div>
                    <div className="text-xs text-theme-muted">Projects</div>
                  </div>
                  <div className="rounded-xl border border-theme-border bg-theme-page p-4">
                    <div className="text-2xl font-bold text-theme-main">{user._count.teams}</div>
                    <div className="text-xs text-theme-muted">Teams</div>
                  </div>
                </div>
              </div>
            </div>

            <AccountDangerZone userId={user.id} />
          </div>
        </div>
      </Container>
    </div>
  );
}
