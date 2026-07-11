import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { requireAuth, requireTeamMember } from '@/lib/authorization';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    const project = await requireTeamMember(projectId, session.user.id);
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const pages = await prisma.docPage.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        viewCount: true,
        lastViewedAt: true,
        updatedAt: true,
        createdAt: true,
        content: true
      }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pageHealth = pages.map(page => {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(page.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysSinceCreation = Math.floor(
        (Date.now() - new Date(page.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      let freshness: 'fresh' | 'aging' | 'stale' | 'critical' = 'fresh';
      if (daysSinceUpdate > 90) freshness = 'critical';
      else if (daysSinceUpdate > 30) freshness = 'stale';
      else if (daysSinceUpdate > 14) freshness = 'aging';

      const engagement: 'high' | 'medium' | 'low' | 'none' = 
        page.viewCount >= 10 ? 'high' :
        page.viewCount >= 5 ? 'medium' :
        page.viewCount >= 1 ? 'low' : 'none';

      const contentLength = page.content?.length || 0;
      const quality: 'rich' | 'adequate' | 'thin' | 'empty' =
        contentLength >= 1000 ? 'rich' :
        contentLength >= 200 ? 'adequate' :
        contentLength > 0 ? 'thin' : 'empty';

      let healthScore = 100;
      if (freshness === 'critical') healthScore -= 40;
      else if (freshness === 'stale') healthScore -= 25;
      else if (freshness === 'aging') healthScore -= 10;

      if (engagement === 'none') healthScore -= 30;
      else if (engagement === 'low') healthScore -= 15;

      if (quality === 'empty') healthScore -= 30;
      else if (quality === 'thin') healthScore -= 15;

      healthScore = Math.max(0, healthScore);

      return {
        id: page.id,
        title: page.title,
        slug: page.slug,
        published: page.published,
        viewCount: page.viewCount,
        lastViewedAt: page.lastViewedAt,
        updatedAt: page.updatedAt,
        daysSinceUpdate,
        daysSinceCreation,
        freshness,
        engagement,
        quality,
        healthScore
      };
    });

    return NextResponse.json({ pages: pageHealth });
  } catch (error) {
    console.error('Failed to fetch health data:', error);
    return NextResponse.json({ error: 'Failed to fetch health data' }, { status: 500 });
  }
}
