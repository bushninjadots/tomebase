import { auth } from '@/lib/auth';
import { prisma } from '@fluid/database';
import { notFound, redirect } from 'next/navigation';
import { Container } from '@fluid/ui';
import Link from 'next/link';
import { AcceptInviteForm } from './form';
import { Users } from 'lucide-react';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const session = await auth();
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({ where: { token } });

  if (!invitation) notFound();

  if (invitation.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Container>
          <div className="mx-auto max-w-sm text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <h1 className="mt-4 text-xl font-bold text-gray-900">Link Expired</h1>
            <p className="mt-2 text-sm text-gray-500">
              This invitation link has expired. Ask your team admin for a new one.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  if (invitation.accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Container>
          <div className="mx-auto max-w-sm text-center">
            <Users className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="mt-4 text-xl font-bold text-gray-900">Already Accepted</h1>
            <p className="mt-2 text-sm text-gray-500">
              This invitation has already been accepted.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  if (!session?.user?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Container>
          <div className="mx-auto max-w-sm text-center">
            <Users className="mx-auto h-12 w-12 text-fluid-600" />
            <h1 className="mt-4 text-xl font-bold text-gray-900">Join the Team</h1>
            <p className="mt-2 text-sm text-gray-500">
              Sign in to accept this invitation and join the team.
            </p>
            <Link
              href={`/login?callbackUrl=/invite/${token}`}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Sign In to Accept
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const existingMember = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.user.id, teamId: invitation.teamId } },
  });

  if (existingMember) {
    redirect('/dashboard');
  }

  const team = await prisma.team.findUnique({
    where: { id: invitation.teamId },
    select: { name: true },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Container>
        <div className="mx-auto max-w-sm text-center">
          <Users className="mx-auto h-12 w-12 text-fluid-600" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Join {team?.name ?? 'the Team'}</h1>
          <p className="mt-2 text-sm text-gray-500">
            You&apos;ve been invited to join this team. Accept to get started.
          </p>
          <div className="mt-8">
            <AcceptInviteForm token={token} userId={session.user.id} />
          </div>
        </div>
      </Container>
    </div>
  );
}
