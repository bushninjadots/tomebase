import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@fluid/database';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProfileSection } from '@/components/account/profile-section';
import { SecuritySection } from '@/components/account/security-section';
import { AppearanceSection } from '@/components/account/appearance-section';
import { UsageSection } from '@/components/account/usage-section';
import { ConnectedAccountsSection } from '@/components/account/connected-accounts-section';
import { NotificationsSection } from '@/components/account/notifications-section';
import { ApiAccessSection } from '@/components/account/api-access-section';
import { ActivitySection } from '@/components/account/activity-section';
import { ExportSection } from '@/components/account/export-section';
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
      password: true,
      createdAt: true,
    },
  });

  if (!user) redirect('/login');

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { provider: true },
  });

  const connectedProviders = accounts.map((a) => a.provider);

  return (
    <div className="min-h-screen bg-theme-page">
      <div className="mx-auto max-w-2xl px-6 py-8">
        {/* Breadcrumb */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-theme-muted hover:text-theme-main transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-theme-main tracking-tight">Account Settings</h1>
          <p className="mt-1.5 text-sm text-theme-muted">
            Manage your profile, security, and preferences.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* Profile — Who am I? */}
          <ProfileSection
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              createdAt: user.createdAt,
              hasPassword: !!user.password,
              connectedProviders,
            }}
          />

          {/* Security — How do I secure my account? */}
          <SecuritySection
            hasPassword={!!user.password}
            connectedProviders={connectedProviders}
            hasOAuth={connectedProviders.length > 0}
          />

          {/* Appearance — How do I personalize? */}
          <AppearanceSection />

          {/* Usage Summary */}
          <UsageSection userId={user.id} />

          {/* Connected Accounts */}
          <ConnectedAccountsSection userId={user.id} />

          {/* Notifications */}
          <NotificationsSection />

          {/* Recent Activity */}
          <ActivitySection />

          {/* API Access */}
          <ApiAccessSection />

          {/* Export Data */}
          <ExportSection />

          {/* Danger Zone */}
          <AccountDangerZone userId={user.id} />
        </div>
      </div>
    </div>
  );
}
