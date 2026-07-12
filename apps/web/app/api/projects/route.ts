import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { slugify } from '@fluid/utils';
import { auth } from '@/lib/auth';
import { projectTemplates } from '@/lib/project-templates';
import { templates } from '@/lib/templates';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, templateId } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 });
    }

    if (description && typeof description === 'string' && description.length > 500) {
      return NextResponse.json({ error: 'Description must be 500 characters or less' }, { status: 400 });
    }

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
      const projectTemplate = projectTemplates.find((t) => t.id === templateId);
      if (projectTemplate) {
        let order = 0;
        for (const pageDef of projectTemplate.pages) {
          const pageTemplate = templates.find((t) => t.id === pageDef.templateId);
          const content = pageTemplate?.content
            ? pageTemplate.content.replace(/{{title}}/g, pageDef.title).replace(/{{date}}/g, new Date().toLocaleDateString())
            : '';
          await prisma.docPage.create({
            data: {
              title: pageDef.title,
              slug: slugify(pageDef.title),
              content,
              description: pageDef.description || null,
              projectId: project.id,
              order,
              published: true,
            },
          });
          order++;
        }
      }
    }

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
