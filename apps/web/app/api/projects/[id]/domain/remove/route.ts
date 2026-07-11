import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { removeDomain, isVercelConfigured } from '@/lib/vercel';

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
      select: {
        id: true,
        customDomain: true,
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.customDomain) {
      return NextResponse.json({ error: 'No custom domain configured' }, { status: 400 });
    }

    if (isVercelConfigured()) {
      try {
        await removeDomain(project.customDomain);
      } catch {
        // Domain may not exist in Vercel, continue with DB cleanup
      }
    }

    await prisma.project.update({
      where: { id },
      data: {
        customDomain: null,
        domainStatus: null,
        domainVerifiedAt: null,
        domainLastCheckedAt: null,
        domainSslStatus: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove domain:', error);
    return NextResponse.json({ error: 'Failed to remove domain' }, { status: 500 });
  }
}
