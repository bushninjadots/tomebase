import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { slugify } from '@fluid/utils';

export async function POST(request: Request) {
  try {
    const { name, description, userId } = await request.json();

    if (!name || !userId) {
      return NextResponse.json({ error: 'Name and userId are required' }, { status: 400 });
    }

    const { getOrCreatePersonalTeam } = await import('@/lib/team');
    const team = await getOrCreatePersonalTeam(userId);

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

    while (await prisma.project.findFirst({ where: { slug, userId } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const project = await prisma.project.create({
      data: { name, slug, description, userId, teamId: team.id },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: { _count: { select: { pages: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
