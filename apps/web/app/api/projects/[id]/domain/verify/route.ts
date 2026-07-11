import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyDomain, isVercelConfigured } from '@/lib/vercel';

export async function POST(
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
      select: {
        id: true,
        customDomain: true,
        domainStatus: true,
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.customDomain) {
      return NextResponse.json({ error: 'No custom domain configured' }, { status: 400 });
    }

    if (!isVercelConfigured()) {
      return NextResponse.json(
        { error: 'Domain verification is not configured. Set VERCEL_TOKEN and VERCEL_PROJECT_ID.' },
        { status: 503 },
      );
    }

    const result = await verifyDomain(project.customDomain);

    await prisma.project.update({
      where: { id },
      data: {
        domainStatus: result.verified ? 'verified' : 'pending',
        domainVerifiedAt: result.verified && result.verifiedAt
          ? new Date(result.verifiedAt)
          : result.verified
            ? new Date()
            : null,
        domainLastCheckedAt: new Date(),
        domainSslStatus: result.verified ? 'active' : 'provisioning',
      },
    });

    return NextResponse.json({
      domain: project.customDomain,
      verified: result.verified,
      verifiedAt: result.verifiedAt
        ? new Date(result.verifiedAt).toISOString()
        : null,
    });
  } catch (error) {
    console.error('Failed to verify domain:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify domain' },
      { status: 500 },
    );
  }
}
