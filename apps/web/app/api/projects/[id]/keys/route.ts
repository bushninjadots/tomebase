import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateApiKey, hashApiKey, extractPrefix } from '@/lib/api-auth';
import { logActivity } from '@/lib/activity';

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
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const keys = await prisma.apiKey.findMany({
      where: { projectId: id },
      select: { id: true, name: true, prefix: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(keys);
  } catch (error) {
    console.error('Failed to list API keys:', error);
    return NextResponse.json({ error: 'Failed to list API keys' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
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
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const expiresInDays = body.expiresInDays;
    if (expiresInDays !== null && expiresInDays !== undefined) {
      if (typeof expiresInDays !== 'number' || !Number.isInteger(expiresInDays) || expiresInDays < 1) {
        return NextResponse.json({ error: 'expiresInDays must be a positive integer or null' }, { status: 400 });
      }
    }

    const rawKey = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        name: body.name,
        prefix: extractPrefix(rawKey),
        key: hashApiKey(rawKey),
        projectId: id,
        expiresAt: expiresInDays
          ? new Date(Date.now() + expiresInDays * 86400000)
          : null,
      },
      select: { id: true, name: true, prefix: true, createdAt: true, expiresAt: true },
    });

    logActivity({
      userId: session.user.id,
      action: 'api_key.created',
      entity: 'api_key',
      entityId: apiKey.id,
      details: { name: apiKey.name, projectId: id },
    });

    return NextResponse.json({ ...apiKey, key: rawKey }, { status: 201 });
  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}
