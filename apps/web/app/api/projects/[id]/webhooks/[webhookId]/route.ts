import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { requireTeamMember } from '@/lib/authorization';
import { withAuth, notFound, badRequest } from '@/lib/api-helpers';
import { isValidWebhookUrl } from '@/lib/webhooks';

export const PATCH = withAuth(async (session, request, { params }) => {
  const { id, webhookId } = await params;

  const project = await requireTeamMember(id, session.user.id);
  if (!project) return notFound();

  const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
  if (!webhook || webhook.projectId !== id) return notFound('Webhook not found');

  const body = await request.json();
  const { active, events, url } = body;

  if (url !== undefined && typeof url === 'string') {
    if (!isValidWebhookUrl(url)) {
      return badRequest('Invalid webhook URL');
    }
  }

  const updated = await prisma.webhook.update({
    where: { id: webhookId },
    data: {
      ...(active !== undefined && { active }),
      ...(events !== undefined && { events }),
      ...(url !== undefined && { url }),
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (session, _request, { params }) => {
  const { id, webhookId } = await params;

  const project = await requireTeamMember(id, session.user.id);
  if (!project) return notFound();

  const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
  if (!webhook || webhook.projectId !== id) return notFound('Webhook not found');

  await prisma.webhook.delete({ where: { id: webhookId } });

  return NextResponse.json({ deleted: true });
});
