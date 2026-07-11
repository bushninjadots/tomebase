import { prisma } from '@fluid/database';
import { auth } from '@/lib/auth';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session;
}

export async function requireTeamMember(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      team: { members: { some: { userId } } },
    },
  });
}

export async function requireTeamAdmin(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      team: { members: { some: { userId, role: 'admin' } } },
    },
  });
}

export async function getPageWithProjectAccess(pageId: string, userId: string) {
  return prisma.docPage.findFirst({
    where: {
      id: pageId,
      project: {
        team: { members: { some: { userId } } },
      },
    },
    include: { project: { select: { id: true, teamId: true } } },
  });
}
