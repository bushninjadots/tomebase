import { prisma } from '@fluid/database';
import { slugify } from '@fluid/utils';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

export async function getOrCreatePersonalTeam(userId: string) {
  const existing = await prisma.teamMember.findFirst({
    where: { userId },
    include: { team: true },
  });

  if (existing) return existing.team;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const name = `${user?.name ?? 'Personal'}'s Team`;
  const slug = slugify(name) + '-' + userId.slice(0, 8);

  try {
    const team = await prisma.team.create({
      data: { name, slug, personal: true },
    });

    await prisma.teamMember.create({
      data: { userId, teamId: team.id, role: 'admin' },
    });

    return team;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const team = await prisma.team.findUnique({ where: { slug } });
      if (team) {
        const alreadyMember = await prisma.teamMember.findFirst({
          where: { userId, teamId: team.id },
        });
        if (!alreadyMember) {
          await prisma.teamMember.create({
            data: { userId, teamId: team.id, role: 'admin' },
          });
        }
        return team;
      }
    }
    throw e;
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
