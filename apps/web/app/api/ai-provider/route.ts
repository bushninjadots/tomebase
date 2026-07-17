import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createNullProvider } from '@/lib/ai-provider/null-provider';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = createNullProvider();

    return NextResponse.json({
      type: provider.type,
      isAvailable: provider.isAvailable,
      capabilities: provider.capabilities,
      message: 'No AI provider configured. Connect a provider to enable AI features.',
    });
  } catch (error) {
    console.error('AI Provider API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
