import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authorization';
import { createProvider } from '@/lib/ai-provider/factory';
import { AI_PROVIDERS, type AIProviderType } from '@/lib/ai-provider/types';

const ALLOWED_PROVIDERS = AI_PROVIDERS.map((p) => p.type) as string[];

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey, baseUrl, model } = body as {
      provider?: string;
      apiKey?: string;
      baseUrl?: string;
      model?: string;
    };

    if (!provider || typeof provider !== 'string') {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    if (!ALLOWED_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: `Invalid provider. Allowed: ${ALLOWED_PROVIDERS.join(', ')}` }, { status: 400 });
    }

    const providerMeta = AI_PROVIDERS.find((p) => p.type === provider);
    if (providerMeta?.requiresApiKey && (!apiKey || typeof apiKey !== 'string')) {
      return NextResponse.json({ error: 'API key is required for this provider' }, { status: 400 });
    }

    const aiProvider = createProvider({
      provider: provider as AIProviderType,
      apiKey: apiKey || undefined,
      baseUrl,
      model,
    });

    const result = await aiProvider.testConnection();

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI provider test failed:', error);
    return NextResponse.json(
      { success: false, message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 },
    );
  }
}
