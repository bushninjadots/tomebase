import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDomain, isVercelConfigured } from '@/lib/vercel';

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
      select: {
        id: true,
        customDomain: true,
        domainStatus: true,
        domainVerifiedAt: true,
        domainLastCheckedAt: true,
        domainSslStatus: true,
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.customDomain) {
      return NextResponse.json({
        domain: null,
        status: null,
        configured: false,
        vercelAvailable: isVercelConfigured(),
      });
    }

    let vercelDomain = null;
    if (isVercelConfigured()) {
      try {
        vercelDomain = await getDomain(project.customDomain);
      } catch {
        // Vercel API not configured or domain not found
      }
    }

    const status = vercelDomain
      ? {
          domain: project.customDomain,
          configured: true,
          vercelAvailable: true,
          verified: vercelDomain.verified,
          verifiedAt: vercelDomain.verifiedAt
            ? new Date(vercelDomain.verifiedAt).toISOString()
            : project.domainVerifiedAt?.toISOString() ?? null,
          lastCheckedAt: project.domainLastCheckedAt?.toISOString() ?? null,
          sslStatus: project.domainSslStatus ?? 'provisioning',
          nameservers: vercelDomain.nameservers ?? [],
          cnames: vercelDomain.cnames ?? [],
        }
      : {
          domain: project.customDomain,
          configured: !!project.customDomain,
          vercelAvailable: isVercelConfigured(),
          verified: project.domainStatus === 'verified',
          verifiedAt: project.domainVerifiedAt?.toISOString() ?? null,
          lastCheckedAt: project.domainLastCheckedAt?.toISOString() ?? null,
          sslStatus: project.domainSslStatus ?? 'provisioning',
          nameservers: [],
          cnames: [],
        };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Failed to get domain status:', error);
    return NextResponse.json({ error: 'Failed to get domain status' }, { status: 500 });
  }
}
