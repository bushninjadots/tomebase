import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { requireAuth } from '@/lib/authorization';
import { AI_PROVIDERS, type AIProviderType } from '@/lib/ai-provider/types';

const ALLOWED_PROVIDERS = AI_PROVIDERS.map((p) => p.type) as string[];

function maskApiKey(apiKey: string | null): string | null {
  if (!apiKey) return null;
  if (apiKey.length <= 4) return '****';
  return `****${apiKey.slice(-4)}`;
}

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configs = await prisma.aIProviderConfig.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
    });

    const result = configs.map((c) => ({
      id: c.id,
      provider: c.provider,
      apiKeyHint: maskApiKey(c.apiKey),
      model: c.model,
      baseUrl: c.baseUrl,
      enabled: c.enabled,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to list AI provider configs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey, model, baseUrl, enabled } = body as {
      provider?: string;
      apiKey?: string;
      model?: string;
      baseUrl?: string;
      enabled?: boolean;
    };

    if (!provider || typeof provider !== 'string') {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    if (!ALLOWED_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: `Invalid provider. Allowed: ${ALLOWED_PROVIDERS.join(', ')}` }, { status: 400 });
    }

    const existing = await prisma.aIProviderConfig.findUnique({
      where: { userId_provider: { userId: session.user.id, provider } },
    });

    let config;
    if (existing) {
      config = await prisma.aIProviderConfig.update({
        where: { id: existing.id },
        data: {
          ...(apiKey !== undefined && { apiKey }),
          ...(model !== undefined && { model: model || null }),
          ...(baseUrl !== undefined && { baseUrl: baseUrl || null }),
          ...(enabled !== undefined && { enabled }),
        },
      });
    } else {
      config = await prisma.aIProviderConfig.create({
        data: {
          userId: session.user.id,
          provider,
          apiKey: apiKey || null,
          model: model || null,
          baseUrl: baseUrl || null,
          enabled: enabled ?? true,
        },
      });
    }

    return NextResponse.json({
      id: config.id,
      provider: config.provider,
      apiKeyHint: maskApiKey(config.apiKey),
      model: config.model,
      baseUrl: config.baseUrl,
      enabled: config.enabled,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error('Failed to save AI provider config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider } = body as { provider?: string };

    if (!provider || typeof provider !== 'string') {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const existing = await prisma.aIProviderConfig.findUnique({
      where: { userId_provider: { userId: session.user.id, provider } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Provider config not found' }, { status: 404 });
    }

    await prisma.aIProviderConfig.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete AI provider config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
