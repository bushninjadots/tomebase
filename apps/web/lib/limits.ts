import { prisma } from '@fluid/database';

export const TIERS = {
  free: { maxProjects: 1, maxPages: Infinity, maxMembers: 5, customDomain: false, hideBranding: false },
  pro: { maxProjects: Infinity, maxPages: Infinity, maxMembers: Infinity, customDomain: true, hideBranding: true },
} as const;

export type Tier = keyof typeof TIERS;

export async function checkProjectLimit(teamId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { tier: true } });
  const tier = isValidTier(team?.tier) ? (team!.tier as Tier) : 'free';
  const limit = TIERS[tier].maxProjects;
  const current = await prisma.project.count({ where: { teamId } });
  return { allowed: current < limit, limit: Number.isFinite(limit) ? limit : current + 1, current };
}

export async function checkPageLimit(projectId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { team: { select: { tier: true } } },
  });
  const tier = isValidTier(project?.team?.tier) ? (project!.team!.tier as Tier) : 'free';
  const limit = TIERS[tier].maxPages;
  const current = await prisma.docPage.count({ where: { projectId } });
  return { allowed: current < limit, limit: Number.isFinite(limit) ? limit : current + 1, current };
}

export async function checkMemberLimit(teamId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { tier: true } });
  const tier = isValidTier(team?.tier) ? (team!.tier as Tier) : 'free';
  const limit = TIERS[tier].maxMembers;
  const current = await prisma.teamMember.count({ where: { teamId } });
  return { allowed: current < limit, limit: Number.isFinite(limit) ? limit : current + 1, current };
}

export async function getTeamTier(teamId: string): Promise<Tier> {
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { tier: true } });
  return isValidTier(team?.tier) ? (team!.tier as Tier) : 'free';
}

function isValidTier(tier: string | undefined | null): tier is Tier {
  return tier === 'free' || tier === 'pro';
}
