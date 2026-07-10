import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fluid/database';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; webhookId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { webhookId } = await params;
  const body = await request.json();
  const { active, events, url } = body;

  const webhook = await prisma.webhook.update({
    where: { id: webhookId },
    data: {
      ...(active !== undefined && { active }),
      ...(events !== undefined && { events }),
      ...(url !== undefined && { url }),
    },
  });

  return NextResponse.json(webhook);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; webhookId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { webhookId } = await params;

  await prisma.webhook.delete({ where: { id: webhookId } });

  return NextResponse.json({ deleted: true });
}
