import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { addDomain, isVercelConfigured } from '@/lib/vercel';
import { eventBus } from '@/lib/events';
import { triggerWebhooks } from '@/lib/webhooks';

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
    if (typeof body.customDomain === 'string' && body.customDomain !== '') {
      const { getTeamTier, TIERS } = await import('@/lib/limits');
      const tier = project.teamId ? await getTeamTier(project.teamId) : 'free';
      if (!TIERS[tier].customDomain) {
        return NextResponse.json(
          { error: 'Custom domains require a Pro plan' },
          { status: 403 },
        );
      }

      const domain = body.customDomain.trim().toLowerCase();
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(domain)) {
        return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
      }

      const existingDomain = await prisma.project.findFirst({
        where: { customDomain: domain, id: { not: id } },
      });
      if (existingDomain) {
        return NextResponse.json({ error: 'This domain is already in use' }, { status: 409 });
      }

      updateData.customDomain = domain;
      updateData.domainStatus = 'pending';
      updateData.domainSslStatus = 'provisioning';

      if (isVercelConfigured()) {
        try {
          await addDomain(domain);
        } catch {
          // Domain registration with Vercel is best-effort;
          // user can still retry via the verify endpoint
        }
      }
    }
    if (body.customDomain === '') {
      updateData.customDomain = null;
      updateData.domainStatus = null;
      updateData.domainVerifiedAt = null;
      updateData.domainLastCheckedAt = null;
      updateData.domainSslStatus = null;

      if (isVercelConfigured() && project.customDomain) {
        try {
          const { removeDomain: removeFromVercel } = await import('@/lib/vercel');
          await removeFromVercel(project.customDomain);
        } catch {
          // Best-effort cleanup
        }
      }
    }
    if (typeof body.logoUrl === 'string') updateData.logoUrl = body.logoUrl;

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    // Emit events + webhooks when project publish state changes
    if (typeof body.published === 'boolean' && body.published !== project.published) {
      const event = body.published ? 'project:published' : 'project:unpublished';
      eventBus.emit(event, { projectId: id });
      triggerWebhooks(id, event, { projectId: id, name: updated.name });
    }

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
