import { prisma } from '@fluid/database';

export const TIERS = {
  free: { maxProjects: 1, maxPages: 50, maxMembers: 3, customDomain: false },
  pro: { maxProjects: 10, maxPages: 500, maxMembers: 15, customDomain: true },
  enterprise: { maxProjects: 100, maxPages: 10000, maxMembers: 100, customDomain: true },
} as const;

export type Tier = keyof typeof TIERS;

export async function checkProjectLimit(teamId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { tier: true } });
  const tier = (team?.tier as Tier) || 'free';
  const limit = TIERS[tier].maxProjects;
  const current = await prisma.project.count({ where: { teamId } });
  return { allowed: current < limit, limit, current };
}

export async function checkPageLimit(projectId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { team: { select: { tier: true } } },
  });
  const tier = (project?.team?.tier as Tier) || 'free';
  const limit = TIERS[tier].maxPages;
  const current = await prisma.docPage.count({ where: { projectId } });
  return { allowed: current < limit, limit, current };
}

export async function checkMemberLimit(teamId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { tier: true } });
  const tier = (team?.tier as Tier) || 'free';
  const limit = TIERS[tier].maxMembers;
  const current = await prisma.teamMember.count({ where: { teamId } });
  return { allowed: current < limit, limit, current };
}

export async function getTeamTier(teamId: string): Promise<Tier> {
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { tier: true } });
  return (team?.tier as Tier) || 'free';
}
