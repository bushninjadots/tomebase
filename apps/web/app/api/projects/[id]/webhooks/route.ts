import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import crypto from 'crypto';
import { requireTeamMember } from '@/lib/authorization';
import { withAuth, unauthorized, notFound, badRequest } from '@/lib/api-helpers';
import { isValidWebhookUrl } from '@/lib/webhooks';

export const GET = withAuth(async (session, _request, { params }) => {
  const { id } = await params;

  const project = await requireTeamMember(id, session.user.id);
  if (!project) return notFound();

  const webhooks = await prisma.webhook.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(webhooks);
});

export const POST = withAuth(async (session, request, { params }) => {
  const { id } = await params;

  const project = await requireTeamMember(id, session.user.id);
  if (!project) return notFound();

  const body = await request.json();
  const { url, events } = body;

  if (!url || typeof url !== 'string') {
    return badRequest('URL is required');
  }

  if (!isValidWebhookUrl(url)) {
    return badRequest('Invalid webhook URL');
  }

  const secret = crypto.randomBytes(32).toString('hex');

  const webhook = await prisma.webhook.create({
    data: {
      url,
      secret,
      events: events || 'page.created,page.updated,page.published',
      projectId: id,
    },
  });

  return NextResponse.json(webhook);
}, { rateLimit: 'standard' });
