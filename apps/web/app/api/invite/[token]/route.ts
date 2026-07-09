import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.accepted) {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 400 });
    }

    return NextResponse.json({
      teamId: invitation.teamId,
      role: invitation.role,
    });
  } catch (error) {
    console.error('Failed to get invitation:', error);
    return NextResponse.json({ error: 'Failed to get invitation' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 400 });
    }

    const existing = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: invitation.teamId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already a member' }, { status: 400 });
    }

    await prisma.teamMember.create({
      data: { userId, teamId: invitation.teamId, role: invitation.role },
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { accepted: true },
    });

    return NextResponse.json({ success: true, teamId: invitation.teamId });
  } catch (error) {
    console.error('Failed to accept invitation:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
