import { NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { triggerWebhooks } from '@/lib/webhooks';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Reject requests older than 5 minutes (replay protection)
  const timestamp = request.headers.get('x-vercel-cron-execution-time') || request.headers.get('x-cron-timestamp');
  if (timestamp) {
    const age = Date.now() - new Date(timestamp).getTime();
    if (age > 5 * 60 * 1000) {
      return NextResponse.json({ error: 'Stale cron request rejected' }, { status: 410 });
    }
  }

  try {
    const toPublish = await prisma.scheduledPublish.findMany({
      where: {
        publishAt: { lte: new Date() },
      },
      include: { page: true },
    });

    for (const schedule of toPublish) {
      await prisma.docPage.update({
        where: { id: schedule.pageId },
        data: { published: true },
      });

      await triggerWebhooks(schedule.page.projectId, 'page.published', {
        pageId: schedule.page.id,
        title: schedule.page.title,
        slug: schedule.page.slug,
      });

      await prisma.scheduledPublish.delete({ where: { id: schedule.id } });
    }

    const toUnpublish = await prisma.scheduledPublish.findMany({
      where: {
        unpublishAt: { not: null, lte: new Date() },
      },
      include: { page: true },
    });

    for (const schedule of toUnpublish) {
      await prisma.docPage.update({
        where: { id: schedule.pageId },
        data: { published: false },
      });

      await triggerWebhooks(schedule.page.projectId, 'page.unpublished', {
        pageId: schedule.page.id,
        title: schedule.page.title,
        slug: schedule.page.slug,
      });

      await prisma.scheduledPublish.delete({ where: { id: schedule.id } });
    }

    return NextResponse.json({
      published: toPublish.length,
      unpublished: toUnpublish.length,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process scheduled publishes' }, { status: 500 });
  }
}
