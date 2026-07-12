import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import Link from 'next/link';
import { TeamSettings } from './team-settings';
import { ArrowLeft } from 'lucide-react';

export default async function TeamSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          personal: true,
          tier: true,
          stripeSubscriptionId: true,
          stripeCancelAtPeriodEnd: true,
          currentPeriodEnd: true,
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
          _count: { select: { projects: true } },
        },
      },
    },
  });

  if (!membership) redirect('/dashboard');

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
          <h1 className="text-3xl font-bold text-theme-main">Team Settings</h1>
          <p className="mt-2 text-sm text-theme-subtle">
            Manage your team, invite members, and control access.
          </p>

          <div className="mt-8">
            <TeamSettings
              team={{
                ...membership.team,
                currentPeriodEnd: membership.team.currentPeriodEnd?.toISOString() || null,
              }}
              currentUserId={session.user.id}
              currentUserRole={membership.role}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
