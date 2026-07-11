import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import crypto from 'crypto';
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const project = await requireTeamMember(id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const webhooks = await prisma.webhook.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(webhooks);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const project = await requireTeamMember(id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const { url, events } = body;

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  if (!isValidWebhookUrl(url)) {
    return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 });
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
}
