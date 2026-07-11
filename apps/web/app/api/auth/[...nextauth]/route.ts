import { handlers } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse, cleanupRateLimits } from '@/lib/rate-limit';

const { GET, POST: originalPOST } = handlers;

async function rateLimitedPOST(request: Request) {
  cleanupRateLimits();

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateLimit = checkRateLimit(`login:${ip}`, 10, 60_000);
  const rateLimited = rateLimitResponse(rateLimit);
  if (rateLimited) return rateLimited;

  return originalPOST(request);
}

export { GET };
export const POST = rateLimitedPOST;
