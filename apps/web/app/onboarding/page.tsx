import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@fluid/database';
import { OnboardingWizard } from '@/components/onboarding-wizard';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, onboarded: true },
  });

  if (!user) redirect('/login');
  if (user.onboarded) redirect('/dashboard');

  return <OnboardingWizard userName={user.name || 'User'} />;
}
