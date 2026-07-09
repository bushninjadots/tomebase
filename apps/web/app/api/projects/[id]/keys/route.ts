import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth } from '@/lib/auth';

function generateApiKey(): string {
  return `fl_${crypto.randomBytes(24).toString('hex')}`;
}

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
      select: { id: true, name: true, createdAt: true, expiresAt: true },
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

    const key = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        name: body.name,
        key,
        projectId: id,
        expiresAt: expiresInDays
          ? new Date(Date.now() + expiresInDays * 86400000)
          : null,
      },
      select: { id: true, name: true, key: true, createdAt: true, expiresAt: true },
    });

    return NextResponse.json(apiKey, { status: 201 });
  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}
