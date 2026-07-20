import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@fluid/database';
import { getOrCreatePersonalTeam } from '@/lib/team';
import { DashboardLive } from '@/components/dashboard-live';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!userExists) redirect('/login');

  try {
    await getOrCreatePersonalTeam(session.user.id, session.user.name);
  } catch (e) {
    console.error('Dashboard: failed to get/create team:', e);
    redirect('/login');
  }

  return <DashboardLive />;
}
