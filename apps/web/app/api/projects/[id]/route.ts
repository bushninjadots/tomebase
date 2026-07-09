import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const project = await prisma.project.findFirst({
      where: {
        id,
        team: { members: { some: { userId: session.user.id } } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (typeof body.name === 'string') updateData.name = body.name;
    if (typeof body.description === 'string') updateData.description = body.description;
    if (typeof body.published === 'boolean') updateData.published = body.published;
    if (typeof body.customDomain === 'string') updateData.customDomain = body.customDomain;
    if (body.customDomain === '') updateData.customDomain = null;

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        team: { members: { some: { userId: session.user.id, role: 'admin' } } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await prisma.docPage.deleteMany({ where: { projectId: id } });
    await prisma.apiKey.deleteMany({ where: { projectId: id } });
    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const project = await prisma.project.findFirst({
      where: {
        id,
        team: { members: { some: { userId: session.user.id } } },
      },
      include: { _count: { select: { pages: true } } },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}
