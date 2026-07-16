import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fluid/database';
import { hashApiKey, generateApiKey, extractPrefix } from '@/lib/api-auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tokens = await prisma.personalAccessToken.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      prefix: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(tokens);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, expiresInDays } = await req.json();

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const rawToken = generateApiKey();
  const hash = await hashApiKey(rawToken);
  const prefix = extractPrefix(rawToken);

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const token = await prisma.personalAccessToken.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      prefix,
      hash,
      expiresAt,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ...token, rawToken });
}
