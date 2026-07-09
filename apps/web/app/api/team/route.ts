import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { slugify } from '@fluid/utils';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
      include: {
        team: {
          include: {
            _count: { select: { projects: true, members: true } },
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    return NextResponse.json(membership.team);
  } catch (error) {
    console.error('Failed to fetch team:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, name } = await request.json();

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId: session.user.id, teamId, role: 'admin' },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof name === 'string') {
      updateData.name = name;
      updateData.slug = slugify(name) + '-' + teamId.slice(0, 8);
    }

    const team = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error('Failed to update team:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}
