import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { requireAuth, requireTeamMember } from '@/lib/authorization';

function isValidWebhookUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const hostname = url.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return false;
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; webhookId: string }> }
) {
  const session = await requireAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, webhookId } = await params;

  const project = await requireTeamMember(id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
  if (!webhook || webhook.projectId !== id) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  const body = await request.json();
  const { active, events, url } = body;

  if (url !== undefined && typeof url === 'string') {
    if (!isValidWebhookUrl(url)) {
      return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 });
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
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; webhookId: string }> }
) {
  const session = await requireAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, webhookId } = await params;

  const project = await requireTeamMember(id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
  if (!webhook || webhook.projectId !== id) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  await prisma.webhook.delete({ where: { id: webhookId } });

  return NextResponse.json({ deleted: true });
}
