import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');

  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json(members);
}
