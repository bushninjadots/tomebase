import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fluid/database';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPreferences: true },
  });

  const prefs = user?.notificationPreferences
    ? JSON.parse(user.notificationPreferences as string)
    : {};

  return NextResponse.json(prefs);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prefs = await req.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { notificationPreferences: JSON.stringify(prefs) },
  });

  return NextResponse.json({ success: true });
}
