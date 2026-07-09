import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { generateInviteToken } from '@/lib/team';

export async function POST(request: Request) {
  try {
    const { teamId, userId } = await request.json();

    if (!teamId || !userId) {
      return NextResponse.json({ error: 'teamId and userId are required' }, { status: 400 });
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId, teamId, role: 'admin' },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { checkMemberLimit } = await import('@/lib/limits');
    const limit = await checkMemberLimit(teamId);
    if (!limit.allowed) {
      return NextResponse.json({
        error: `Team member limit reached (${limit.current}/${limit.limit}). Upgrade to add more members.`,
      }, { status: 403 });
    }

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: { email: '', teamId, token, expiresAt },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/invite/${invitation.token}`;

    return NextResponse.json({ url: inviteUrl, token: invitation.token });
  } catch (error) {
    console.error('Failed to create invitation:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');

  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }

  const invitations = await prisma.invitation.findMany({
    where: { teamId, accepted: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(invitations);
}
