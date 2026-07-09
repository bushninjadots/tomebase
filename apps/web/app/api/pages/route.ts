import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { slugify } from '@fluid/utils';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, projectId, parentId } = await request.json();

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and projectId are required' }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        team: { members: { some: { userId: session.user.id } } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { checkPageLimit } = await import('@/lib/limits');
    const limit = await checkPageLimit(projectId);
    if (!limit.allowed) {
      return NextResponse.json({
        error: `Page limit reached (${limit.current}/${limit.limit}). Upgrade to create more pages.`,
      }, { status: 403 });
    }

    const baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.docPage.findFirst({ where: { projectId, slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const maxOrder = await prisma.docPage.findFirst({
      where: { projectId, parentId: parentId ?? null },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const page = await prisma.docPage.create({
      data: {
        title,
        slug,
        content: content ?? '',
        projectId,
        parentId: parentId ?? null,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error('Failed to create page:', error);
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        team: { members: { some: { userId: session.user.id } } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const pages = await prisma.docPage.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(pages);
  } catch (error) {
    console.error('Failed to fetch pages:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}
