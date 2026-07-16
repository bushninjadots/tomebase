import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fluid/database';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessions = await prisma.session.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      expires: true,
    },
    orderBy: { expires: 'desc' },
  });

  return NextResponse.json(
    sessions.map((s) => ({
      id: s.id,
      expires: s.expires,
      isCurrent: false, // We'll rely on the client to mark the current one
    }))
  );
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId } = await req.json();

  const targetSession = await prisma.session.findFirst({
    where: { id: sessionId, userId: session.user.id },
  });

  if (!targetSession) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.session.delete({
    where: { id: sessionId },
  });

  return NextResponse.json({ success: true });
}
