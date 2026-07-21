import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/authorization';
import { checkRateLimit, rateLimitResponse, cleanupRateLimits, type RateLimitResult } from '@/lib/rate-limit';
import type { Session } from 'next-auth';

// ─── Rate Limit Tiers ─────────────────────────────────────────

export type RateLimitTier = 'strict' | 'standard' | 'generous' | 'ai' | 'upload';

const RATE_LIMIT_TIERS: Record<RateLimitTier, { maxRequests: number; windowMs: number }> = {
  strict:   { maxRequests: 5,   windowMs: 60_000 },   // signup, delete account, password change
  standard: { maxRequests: 30,  windowMs: 60_000 },   // most POST/PATCH/DELETE routes
  generous: { maxRequests: 60,  windowMs: 60_000 },   // GET requests, search
  ai:       { maxRequests: 10,  windowMs: 60_000 },   // AI endpoints
  upload:   { maxRequests: 10,  windowMs: 60_000 },   // file uploads
};

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return 'unknown';
}

export function checkTierRateLimit(
  request: Request,
  tier: RateLimitTier,
  identifier?: string,
): RateLimitResult {
  cleanupRateLimits();
  const config = RATE_LIMIT_TIERS[tier];
  const ip = getClientIp(request);
  const key = identifier ? `${tier}:${identifier}:${ip}` : `${tier}:${ip}`;
  return checkRateLimit(key, config.maxRequests, config.windowMs);
}

export function enforceRateLimit(request: Request, tier: RateLimitTier, identifier?: string): NextResponse | null {
  const result = checkTierRateLimit(request, tier, identifier);
  if (result.allowed) return null;

  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        'X-RateLimit-Remaining': '0',
      },
    },
  );
}

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

interface WithAuthOptions {
  rateLimit?: RateLimitTier;
}

export function withAuth<TContext extends { params: any }>(
  handler: AuthenticatedHandler<TContext>,
  options?: WithAuthOptions,
) {
  return async (request: Request, context: TContext): Promise<NextResponse> => {
    if (options?.rateLimit) {
      const rlResponse = enforceRateLimit(request, options.rateLimit);
      if (rlResponse) return rlResponse;
    }

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

// ─── Rate Limit Only Wrapper (for unauthenticated routes) ────

type RateLimitedHandler<TContext> = (
  request: Request,
  context: TContext,
) => Promise<NextResponse>;

export function withRateLimit<TContext extends { params: any }>(
  handler: RateLimitedHandler<TContext>,
  tier: RateLimitTier,
) {
  return async (request: Request, context: TContext): Promise<NextResponse> => {
    const rlResponse = enforceRateLimit(request, tier);
    if (rlResponse) return rlResponse;
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('Handler failed:', error);
      return serverError();
    }
  };
}
