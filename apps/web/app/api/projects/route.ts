import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { slugify } from '@fluid/utils';
import { auth } from '@/lib/auth';
import { templateService } from '@/lib/templates';
import { logActivity } from '@/lib/activity';
import { enforceRateLimit } from '@/lib/api-helpers';
import { createProjectSchema, validateBody } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const rl = enforceRateLimit(request, 'standard');
    if (rl) return rl;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const v = validateBody(body, createProjectSchema);
    if (!v.success) return v.error;
    const { name, description } = v.data;
    const { templateId } = body;

    const { getOrCreatePersonalTeam } = await import('@/lib/team');
    const team = await getOrCreatePersonalTeam(session.user.id);

    const { checkProjectLimit } = await import('@/lib/limits');
    const limit = await checkProjectLimit(team.id);
    if (!limit.allowed) {
      return NextResponse.json({
        error: `Project limit reached (${limit.current}/${limit.limit}). Upgrade to create more projects.`,
      }, { status: 403 });
    }

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    const maxAttempts = 10;

    while (await prisma.project.findFirst({ where: { slug, userId: session.user.id } })) {
      counter++;
      if (counter > maxAttempts) {
        return NextResponse.json({ error: 'Could not generate unique slug' }, { status: 409 });
      }
      slug = `${baseSlug}-${counter}`;
    }

    const project = await prisma.project.create({
      data: { name, slug, description, userId: session.user.id, teamId: team.id },
    });

    if (templateId && templateId !== 'blank') {
      const pages = templateService.resolveProjectTemplate(templateId, {
        date: new Date().toLocaleDateString(),
      });
      let order = 0;
      for (const page of pages) {
        await prisma.docPage.create({
          data: {
            title: page.title,
            slug: slugify(page.title),
            content: page.content,
            description: page.description,
            projectId: project.id,
            order,
            published: true,
          },
        });
        order++;
      }
    }

    logActivity({
      userId: session.user.id,
      action: 'project.created',
      entity: 'project',
      entityId: project.id,
      details: { name: project.name },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { team: { members: { some: { userId: session.user.id } } } },
      include: { _count: { select: { pages: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
