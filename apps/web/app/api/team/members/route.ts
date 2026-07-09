import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId: session.user.id, teamId },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Failed to fetch team members:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}
