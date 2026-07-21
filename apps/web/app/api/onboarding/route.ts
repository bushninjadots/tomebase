import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fluid/database';
import { slugify } from '@fluid/utils';
import { getOrCreatePersonalTeam } from '@/lib/team';
import { templateService } from '@/lib/templates';
import { enforceRateLimit } from '@/lib/api-helpers';

export async function POST(req: Request) {
  const rl = enforceRateLimit(req, 'standard');
  if (rl) return rl;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workspaceName, template } = await req.json();

  // Mark user as onboarded
  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboarded: true },
  });

  // Create team with custom name if provided
  if (workspaceName) {
    const team = await getOrCreatePersonalTeam(session.user.id);
    await prisma.team.update({
      where: { id: team.id },
      data: { name: workspaceName },
    });
  }

  // Create initial project based on template
  const team = await getOrCreatePersonalTeam(session.user.id);
  const projectTemplate = templateService.getProjectTemplate(template);
  const projectName = projectTemplate?.name ?? 'My Documentation';
  const projectSlug = slugify(projectName);

  const project = await prisma.project.create({
    data: {
      name: projectName,
      slug: projectSlug,
      teamId: team.id,
      userId: session.user.id,
    },
  });

  // Create template pages
  const pages = templateService.resolveProjectTemplate(template, {
    date: new Date().toLocaleDateString(),
  });

  if (pages.length > 0) {
    await prisma.docPage.createMany({
      data: pages.map((page, i) => ({
        projectId: project.id,
        title: page.title,
        slug: slugify(page.title),
        content: page.content,
        description: page.description,
        order: i,
      })),
    });
  }

  return NextResponse.json({ success: true, projectId: project.id });
}
