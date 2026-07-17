import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAvailableRules } from '@/lib/diagnostics/engine';
import { getAutoFixableRules } from '@/lib/diagnostics/rules';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rules = getAvailableRules();
    const autoFixable = getAutoFixableRules().map((r) => r.id);

    return NextResponse.json({ rules, autoFixable });
  } catch (error) {
    console.error('Rules API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
