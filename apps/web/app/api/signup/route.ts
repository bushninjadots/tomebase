import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { checkRateLimit, rateLimitResponse, rateLimitHeaders, cleanupRateLimits } from '@/lib/rate-limit';
import { signupSchema, validateBody } from '@/lib/validations';

export async function POST(request: Request) {
  cleanupRateLimits();

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateLimit = checkRateLimit(`signup:${ip}`, 5, 60_000);
  const rateLimited = rateLimitResponse(rateLimit);
  if (rateLimited) return rateLimited;

  const rlHeaders = rateLimitHeaders(rateLimit);

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const v = validateBody(body, signupSchema);
    if (!v.success) return v.error;
    const { name, email, password } = v.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (e) {
      console.error('bcrypt error:', e);
      return NextResponse.json({ error: 'Password hashing failed' }, { status: 500 });
    }

    const user = await prisma.user.create({
      data: { name: name || email.split('@')[0], email, password: hashedPassword },
    });

    try {
      const { getOrCreatePersonalTeam } = await import('@/lib/team');
      await getOrCreatePersonalTeam(user.id);
    } catch (e) {
      console.error('Team creation error:', e);
    }

    return NextResponse.json({ success: true }, { status: 201, headers: rlHeaders });
  } catch {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
