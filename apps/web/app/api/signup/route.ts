import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { checkRateLimit, rateLimitResponse, cleanupRateLimits } from '@/lib/rate-limit';

export async function POST(request: Request) {
  cleanupRateLimits();

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateLimit = checkRateLimit(`signup:${ip}`, 5, 60_000);
  const rateLimited = rateLimitResponse(rateLimit);
  if (rateLimited) return rateLimited;

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (typeof email !== 'string' || !email.includes('@') || email.length > 254) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (password.length > 128) {
      return NextResponse.json({ error: 'Password is too long' }, { status: 400 });
    }

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

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
