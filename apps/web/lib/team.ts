import { prisma } from '@fluid/database';
import { slugify } from '@fluid/utils';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

export async function getOrCreatePersonalTeam(userId: string, userName?: string | null | undefined) {
  const existing = await prisma.teamMember.findFirst({
    where: { userId },
    include: { team: true },
  });

  if (existing) return existing.team;

  const name = `${userName ?? 'Personal'}'s Team`;
  const slug = slugify(name) + '-' + userId.slice(0, 8);

  try {
    const team = await prisma.team.create({
      data: { name, slug, personal: true },
    });

    await prisma.teamMember.create({
      data: { userId, teamId: team.id, role: 'admin' },
    });

    return team;
  } catch {
    // Team may already exist (slug collision) or user may not exist yet.
    // Try to find an existing personal team for this user.
    const memberWithTeam = await prisma.teamMember.findFirst({
      where: { userId },
      include: { team: true },
    });
    if (memberWithTeam) return memberWithTeam.team;

    // No team found — create one with a unique slug
    const uniqueSlug = slug + '-' + Date.now().toString(36);
    const team = await prisma.team.create({
      data: { name, slug: uniqueSlug, personal: true },
    });
    await prisma.teamMember.create({
      data: { userId, teamId: team.id, role: 'admin' },
    });
    return team;
  }
}

export async function getTeamProjects(teamId: string) {
  return prisma.project.findMany({
    where: { teamId },
    include: { _count: { select: { pages: true } } },
    orderBy: { updatedAt: 'desc' },
  });
}

export function generateInviteToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export async function getTeamWithMembers(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      _count: { select: { projects: true } },
    },
  });
}
