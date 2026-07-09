import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { generateInviteToken } from '@/lib/team';
import { slugify } from '@fluid/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const membership = await prisma.teamMember.findFirst({
    where: { userId },
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
}

export async function PATCH(request: Request) {
  try {
    const { teamId, name, userId } = await request.json();

    if (!teamId || !userId) {
      return NextResponse.json({ error: 'teamId and userId are required' }, { status: 400 });
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId, teamId, role: 'admin' },
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
