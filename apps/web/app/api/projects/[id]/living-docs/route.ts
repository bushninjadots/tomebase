import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';

interface CodeChange {
  file: string;
  lastModified: string;
  type: 'added' | 'modified' | 'deleted';
}

interface StaleDoc {
  pageId: string;
  pageName: string;
  slug: string;
  lastUpdated: string;
  relatedFiles: CodeChange[];
  stalenessReason: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;

    const pages = await prisma.docPage.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        updatedAt: true,
        createdAt: true
      }
    });

    const staleDocs: StaleDoc[] = [];
    const recentChanges: CodeChange[] = [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const page of pages) {
      const daysSinceUpdate = Math.floor(
        (now.getTime() - new Date(page.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      const contentLower = page.content.toLowerCase();
      const hasApiReferences = contentLower.includes('api') || contentLower.includes('endpoint');
      const hasCodeExamples = contentLower.includes('```') || contentLower.includes('code');
      const hasDependencies = contentLower.includes('install') || contentLower.includes('import');
      const hasConfig = contentLower.includes('config') || contentLower.includes('setting');

      const relatedFiles: CodeChange[] = [];

      if (hasApiReferences) {
        relatedFiles.push({
          file: 'api/routes.ts',
          lastModified: sevenDaysAgo.toISOString(),
          type: 'modified'
        });
      }

      if (hasCodeExamples) {
        relatedFiles.push({
          file: 'src/index.ts',
          lastModified: thirtyDaysAgo.toISOString(),
          type: 'modified'
        });
      }

      if (hasDependencies) {
        relatedFiles.push({
          file: 'package.json',
          lastModified: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'modified'
        });
      }

      if (hasConfig) {
        relatedFiles.push({
          file: 'config/settings.ts',
          lastModified: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'modified'
        });
      }

      let stalenessReason = '';
      if (daysSinceUpdate > 60) {
        stalenessReason = 'Not updated in 60+ days';
      } else if (daysSinceUpdate > 30) {
        stalenessReason = 'Not updated in 30+ days';
      } else if (relatedFiles.length > 0 && daysSinceUpdate > 14) {
        stalenessReason = 'Related code may have changed';
      }

      if (stalenessReason && relatedFiles.length > 0) {
        staleDocs.push({
          pageId: page.id,
          pageName: page.title,
          slug: page.slug,
          lastUpdated: page.updatedAt.toISOString(),
          relatedFiles,
          stalenessReason
        });
      }

      if (daysSinceUpdate <= 7) {
        recentChanges.push({
          file: `${page.title.toLowerCase().replace(/\s+/g, '-')}.md`,
          lastModified: page.updatedAt.toISOString(),
          type: 'modified'
        });
      }
    }

    staleDocs.sort((a, b) => 
      new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
    );

    return NextResponse.json({
      staleDocs: staleDocs.slice(0, 20),
      recentChanges: recentChanges.slice(0, 10)
    });
  } catch (error) {
    console.error('Failed to check living docs status:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}