import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authorization';
import type { Session } from 'next-auth';

// ─── Response Helpers ─────────────────────────────────────────

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(message: string, code?: string) {
  return NextResponse.json({ error: message, ...(code ? { code } : {}) }, { status: 400 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function success(data: Record<string, unknown>) {
  return NextResponse.json({ success: true, ...data });
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json({ error: message }, { status: 500 });
}

// ─── Auth Wrapper ─────────────────────────────────────────────

type AuthenticatedHandler<TContext> = (
  session: Session & { user: { id: string } },
  request: Request,
  context: TContext,
) => Promise<NextResponse>;

export function withAuth<TContext extends { params: any }>(
  handler: AuthenticatedHandler<TContext>,
) {
  return async (request: Request, context: TContext): Promise<NextResponse> => {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return unauthorized();
    }
    try {
      return await handler(session as Session & { user: { id: string } }, request, context);
    } catch (error) {
      console.error('Handler failed:', error);
      return serverError();
    }
  };
}
